const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const CrisisReport = require('../models/CrisisReport');
const AdminAction = require('../models/AdminAction');
const crisisReportRoutes = require('../routes/crisisReports');
const adminRoutes = require('../routes/admin');
const { signToken } = require('../middleware/auth');

test('voluntary crisis requests accept only explicit consent and retain minimal data', async () => {
    const originals = {
        secret: process.env.AUTH_TOKEN_SECRET,
        findById: User.findById,
        userCountDocuments: User.countDocuments,
        assessmentCountDocuments: Assessment.countDocuments,
        exists: CrisisReport.exists,
        create: CrisisReport.create,
        findOne: CrisisReport.findOne,
        findOneAndUpdate: CrisisReport.findOneAndUpdate,
        countDocuments: CrisisReport.countDocuments,
        actionCreate: AdminAction.create
    };
    const userId = '507f1f77bcf86cd799439011';
    const reportId = '507f191e810c19729de860ea';
    const storedReports = [];
    const storedActions = [];
    let existingReportFilter;
    const reportRecord = {
        id: reportId,
        status: 'new',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        save: async () => {}
    };
    let activeUser = { id: userId, emailVerified: true, isAdmin: false, adminRole: null };
    process.env.AUTH_TOKEN_SECRET = 'test-secret-with-more-than-thirty-two-bytes';
    User.findById = async () => activeUser;
    CrisisReport.exists = async (filter) => {
        existingReportFilter = filter;
        return null;
    };
    CrisisReport.create = async (data) => {
        storedReports.push(data);
        return {
            id: reportId,
            status: 'new',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        };
    };
    CrisisReport.findOne = async () => reportRecord;
    CrisisReport.findOneAndUpdate = async (filter, update) => {
        if (reportRecord.status !== filter.status) return null;
        Object.assign(reportRecord, update.$set);
        return reportRecord;
    };
    CrisisReport.countDocuments = async () => 0;
    User.countDocuments = async () => 12;
    Assessment.countDocuments = async (filter) => filter?.deliveryComplete ? 4 : 9;
    AdminAction.create = async (data) => {
        storedActions.push(data);
        return data;
    };

    const app = express();
    app.use(express.json());
    app.use('/api/crisis-reports', crisisReportRoutes);
    app.use('/api/admin', adminRoutes);
    const server = app.listen(0);

    try {
        await new Promise((resolve) => server.once('listening', resolve));
        const baseUrl = `http://127.0.0.1:${server.address().port}`;
        const token = signToken(userId);
        const headers = {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json'
        };

        const rejected = await fetch(`${baseUrl}/api/crisis-reports`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ consent: true, narrative: 'sensitive text' })
        });
        assert.equal(rejected.status, 400);
        assert.equal(storedReports.length, 0);

        const accepted = await fetch(`${baseUrl}/api/crisis-reports`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ consent: true })
        });
        const acceptedBody = await accepted.json();
        assert.equal(accepted.status, 201);
        assert.equal(acceptedBody.report.status, 'new');
        assert.equal(accepted.headers.get('cache-control'), 'no-store');
        assert.deepEqual(Object.keys(storedReports[0]).sort(), ['consentAt', 'requestType', 'user']);
        assert.equal(storedReports[0].requestType, 'contact_request');
        assert.ok(existingReportFilter.expiresAt.$gt instanceof Date);

        const forbidden = await fetch(`${baseUrl}/api/admin/dashboard/stats`, { headers });
        assert.equal(forbidden.status, 403);

        activeUser = {
            id: userId,
            emailVerified: true,
            isAdmin: true,
            adminRole: 'support'
        };
        const supportCannotReview = await fetch(
            `${baseUrl}/api/admin/crisis/incidents/${reportId}/review`,
            {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'reviewed' })
            }
        );
        assert.equal(supportCannotReview.status, 403);

        activeUser.adminRole = 'admin';
        const extraReviewData = await fetch(
            `${baseUrl}/api/admin/crisis/incidents/${reportId}/review`,
            {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'reviewed', notes: 'not stored' })
            }
        );
        assert.equal(extraReviewData.status, 400);

        const reviewed = await fetch(
            `${baseUrl}/api/admin/crisis/incidents/${reportId}/review`,
            {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'reviewed' })
            }
        );
        assert.equal(reviewed.status, 200);
        assert.equal(reportRecord.status, 'reviewed');
        assert.equal(storedActions[0].actionType, 'crisis_report_status_updated');
        assert.equal(storedActions[0].previousValue, 'new');
        assert.equal(storedActions[0].newValue, 'reviewed');
        assert.equal(storedActions[0].expiresAt, reportRecord.expiresAt);

        const repeatedReview = await fetch(
            `${baseUrl}/api/admin/crisis/incidents/${reportId}/review`,
            {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'reviewed' })
            }
        );
        assert.equal(repeatedReview.status, 409);

        const closed = await fetch(
            `${baseUrl}/api/admin/crisis/incidents/${reportId}/review`,
            {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'closed' })
            }
        );
        assert.equal(closed.status, 200);
        assert.equal(reportRecord.status, 'closed');

        const statsResponse = await fetch(`${baseUrl}/api/admin/dashboard/stats`, { headers });
        const stats = await statsResponse.json();
        assert.equal(statsResponse.status, 200);
        assert.equal(stats.total_users, 12);
        assert.equal(stats.total_assessments, 9);
        assert.equal(stats.delivered_books, 4);
        assert.equal(Object.hasOwn(stats, 'total_revenue'), false);
    } finally {
        server.close();
        if (originals.secret === undefined) delete process.env.AUTH_TOKEN_SECRET;
        else process.env.AUTH_TOKEN_SECRET = originals.secret;
        User.findById = originals.findById;
        User.countDocuments = originals.userCountDocuments;
        Assessment.countDocuments = originals.assessmentCountDocuments;
        CrisisReport.exists = originals.exists;
        CrisisReport.create = originals.create;
        CrisisReport.findOne = originals.findOne;
        CrisisReport.findOneAndUpdate = originals.findOneAndUpdate;
        CrisisReport.countDocuments = originals.countDocuments;
        AdminAction.create = originals.actionCreate;
    }
});

test('crisis requests and their audit records expire after their retention period', () => {
    const crisisIndexes = CrisisReport.schema.indexes();
    const auditIndexes = AdminAction.schema.indexes();
    assert.ok(crisisIndexes.some(([fields, options]) =>
        fields.expiresAt === 1 && options.expireAfterSeconds === 0
    ));
    assert.ok(auditIndexes.some(([fields, options]) =>
        fields.expiresAt === 1 && options.expireAfterSeconds === 0
    ));
    assert.equal(CrisisReport.schema.path('narrative'), undefined);
    assert.equal(CrisisReport.schema.path('healthScore'), undefined);
    const now = Date.now();
    const report = new CrisisReport({
        user: '507f1f77bcf86cd799439011',
        consentAt: new Date(now)
    });
    const retentionMs = 90 * 24 * 60 * 60 * 1000;
    assert.ok(report.expiresAt.getTime() >= now + retentionMs - 1000);
    assert.ok(report.expiresAt.getTime() <= now + retentionMs + 1000);
});

test('crisis request details expose only consent metadata and user contact fields', async () => {
    const originalSecret = process.env.AUTH_TOKEN_SECRET;
    const originalFindById = User.findById;
    const originalFindOne = CrisisReport.findOne;
    process.env.AUTH_TOKEN_SECRET = 'test-secret-with-more-than-thirty-two-bytes';
    User.findById = async () => ({
        id: '507f1f77bcf86cd799439011',
        emailVerified: true,
        isAdmin: true,
        adminRole: 'support'
    });
    CrisisReport.findOne = () => ({
        select() { return this; },
        populate() { return this; },
        lean: async () => ({
            _id: '507f191e810c19729de860ea',
            status: 'new',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            reviewedAt: null,
            reviewedBy: null,
            user: { name: 'Requesting User', email: 'user@example.test' }
        })
    });

    const app = express();
    app.use('/api/admin', adminRoutes);
    const server = app.listen(0);
    try {
        await new Promise((resolve) => server.once('listening', resolve));
        const response = await fetch(
            `http://127.0.0.1:${server.address().port}/api/admin/crisis/incidents/507f191e810c19729de860ea`,
            { headers: { authorization: `Bearer ${signToken('507f1f77bcf86cd799439011')}` } }
        );
        const body = await response.json();
        assert.equal(response.status, 200);
        assert.equal(body.incident.status, 'new');
        assert.equal(body.incident.user.email, 'user@example.test');
        assert.equal(Object.hasOwn(body.incident, 'risk_score'), false);
        assert.equal(Object.hasOwn(body.incident, 'analyzed_text'), false);
        assert.equal(Object.hasOwn(body.incident, 'notes'), false);
    } finally {
        server.close();
        if (originalSecret === undefined) delete process.env.AUTH_TOKEN_SECRET;
        else process.env.AUTH_TOKEN_SECRET = originalSecret;
        User.findById = originalFindById;
        CrisisReport.findOne = originalFindOne;
    }
});
