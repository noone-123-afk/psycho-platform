const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const CrisisReport = require('../models/CrisisReport');
const AdminAction = require('../models/AdminAction');
const { requireAuth, requireAdmin, requireRole } = require('../middleware/auth');

const router = express.Router();
const ADMIN_ROLES = ['admin', 'psychologist', 'support'];
const REPORT_STATUSES = ['new', 'reviewed', 'closed'];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const AUDIT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

router.use(requireAuth, requireAdmin);
router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    return next();
});

function parsePagination(query) {
    const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);
    const offset = query.offset === undefined ? 0 : Number(query.offset);
    if (
        !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT ||
        !Number.isInteger(offset) || offset < 0
    ) {
        return null;
    }
    return { limit, offset };
}

function appendAdminAction(action) {
    return AdminAction.create({
        ...action,
        expiresAt: action.targetReport
            ? action.reportExpiresAt
            : new Date(Date.now() + AUDIT_RETENTION_MS)
    });
}

router.get('/dashboard/stats', async (_req, res) => {
    try {
        const activeFilter = { expiresAt: { $gt: new Date() } };
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [totalUsers, totalAssessments, deliveredBooks, total, newReports, reviewed, closed, recent] = await Promise.all([
            User.countDocuments(),
            Assessment.countDocuments(),
            Assessment.countDocuments({ deliveryComplete: true }),
            CrisisReport.countDocuments(activeFilter),
            CrisisReport.countDocuments({ ...activeFilter, status: 'new' }),
            CrisisReport.countDocuments({ ...activeFilter, status: 'reviewed' }),
            CrisisReport.countDocuments({ ...activeFilter, status: 'closed' }),
            CrisisReport.countDocuments({ ...activeFilter, createdAt: { $gte: weekAgo } })
        ]);
        return res.json({
            total_users: totalUsers,
            total_assessments: totalAssessments,
            delivered_books: deliveredBooks,
            total_reports: total,
            new_reports: newReports,
            reviewed_reports: reviewed,
            closed_reports: closed,
            recent_reports_7days: recent
        });
    } catch (error) {
        console.error('Admin dashboard statistics failed:', error.message);
        return res.status(500).json({ message: 'Unable to load dashboard statistics' });
    }
});

router.get('/crisis/incidents', async (req, res) => {
    const pagination = parsePagination(req.query);
    if (!pagination) {
        return res.status(400).json({ message: 'Invalid pagination parameters' });
    }
    const filter = { expiresAt: { $gt: new Date() } };
    if (req.query.status !== undefined) {
        if (!REPORT_STATUSES.includes(req.query.status)) {
            return res.status(400).json({ message: 'Invalid report status' });
        }
        filter.status = req.query.status;
    }

    try {
        const [reports, total] = await Promise.all([
            CrisisReport.find(filter)
                .sort({ createdAt: -1 })
                .skip(pagination.offset)
                .limit(pagination.limit)
                .populate('user', 'name email')
                .lean(),
            CrisisReport.countDocuments(filter)
        ]);
        return res.json({
            incidents: reports.map((report) => ({
                id: report._id.toString(),
                status: report.status,
                detected_at: report.createdAt,
                expires_at: report.expiresAt,
                user: report.user
                    ? { name: report.user.name, email: report.user.email }
                    : null
            })),
            total,
            limit: pagination.limit,
            offset: pagination.offset
        });
    } catch (error) {
        console.error('Admin crisis report list failed:', error.message);
        return res.status(500).json({ message: 'Unable to load crisis requests' });
    }
});

router.get('/crisis/incidents/:incidentId', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.incidentId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
    }
    try {
        const report = await CrisisReport.findOne({
            _id: req.params.incidentId,
            expiresAt: { $gt: new Date() }
        })
            .select('status createdAt expiresAt reviewedAt user reviewedBy')
            .populate('user', 'name email')
            .populate('reviewedBy', 'name email')
            .lean();
        if (!report) {
            return res.status(404).json({ message: 'Crisis request not found' });
        }
        return res.json({
            incident: {
                id: report._id.toString(),
                status: report.status,
                requestedAt: report.createdAt,
                expiresAt: report.expiresAt,
                reviewedAt: report.reviewedAt,
                reviewedBy: report.reviewedBy
                    ? { name: report.reviewedBy.name, email: report.reviewedBy.email }
                    : null,
                user: report.user
                    ? { name: report.user.name, email: report.user.email }
                    : null
            }
        });
    } catch (error) {
        console.error('Admin crisis report detail retrieval failed:', error.message);
        return res.status(500).json({ message: 'Unable to load crisis request details' });
    }
});

router.put(
    '/crisis/incidents/:incidentId/review',
    requireRole('owner', 'admin', 'psychologist'),
    async (req, res) => {
        const { incidentId } = req.params;
        const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
            ? req.body
            : {};
        if (!mongoose.isValidObjectId(incidentId)) {
            return res.status(400).json({ message: 'Invalid report ID' });
        }
        if (
            Object.keys(body).length !== 1 ||
            !Object.hasOwn(body, 'status') ||
            !['reviewed', 'closed'].includes(body.status)
        ) {
            return res.status(400).json({ message: 'Choose a valid review status' });
        }

        try {
            const currentReport = await CrisisReport.findOne({
                _id: incidentId,
                expiresAt: { $gt: new Date() }
            });
            if (!currentReport) {
                return res.status(404).json({ message: 'Crisis request not found' });
            }
            const transitions = {
                new: ['reviewed', 'closed'],
                reviewed: ['closed'],
                closed: []
            };
            if (!transitions[currentReport.status]?.includes(body.status)) {
                return res.status(409).json({ message: 'This crisis request can no longer be changed to that status' });
            }
            const previousStatus = currentReport.status;
            const reviewedAt = new Date();
            const report = await CrisisReport.findOneAndUpdate(
                {
                    _id: incidentId,
                    status: previousStatus,
                    expiresAt: { $gt: reviewedAt }
                },
                {
                    $set: {
                        status: body.status,
                        reviewedBy: req.authUser.id,
                        reviewedAt
                    }
                },
                { new: true }
            );
            if (!report) {
                return res.status(409).json({ message: 'This crisis request changed while it was being reviewed' });
            }
            await appendAdminAction({
                admin: req.authUser.id,
                actionType: 'crisis_report_status_updated',
                targetReport: report.id,
                previousValue: previousStatus,
                newValue: report.status,
                reportExpiresAt: report.expiresAt
            });

            return res.json({
                report: {
                    id: report.id,
                    status: report.status,
                    reviewedAt: report.reviewedAt
                }
            });
        } catch (error) {
            console.error('Crisis request review failed:', error.message);
            return res.status(500).json({ message: 'Unable to update the crisis request' });
        }
    }
);

router.get('/admins', requireRole('owner'), async (_req, res) => {
    try {
        const admins = await User.find({ isAdmin: true, adminRole: { $in: ['owner', ...ADMIN_ROLES] } })
            .select('name email adminRole createdAt')
            .sort({ adminRole: 1, name: 1 })
            .lean();
        return res.json({
            admins: admins.map((admin) => ({
                id: admin._id.toString(),
                name: admin.name,
                email: admin.email,
                role: admin.adminRole,
                createdAt: admin.createdAt
            }))
        });
    } catch (error) {
        console.error('Admin account list failed:', error.message);
        return res.status(500).json({ message: 'Unable to load administrator accounts' });
    }
});

router.post('/admins', requireRole('owner'), async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const role = req.body?.role;
    if (
        Object.keys(req.body || {}).some((key) => !['email', 'role'].includes(key)) ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !ADMIN_ROLES.includes(role)
    ) {
        return res.status(400).json({ message: 'Enter an existing account email and a valid administrator role' });
    }
    if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
        return res.status(409).json({ message: 'The configured owner role cannot be changed here' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || !user.emailVerified) {
            return res.status(404).json({ message: 'A verified user account with this email was not found' });
        }
        const previousRole = user.adminRole || 'none';
        user.adminRole = role;
        user.isAdmin = true;
        await user.save();
        await appendAdminAction({
            admin: req.authUser.id,
            actionType: 'admin_role_updated',
            targetUser: user.id,
            previousValue: previousRole,
            newValue: role
        });
        return res.status(201).json({
            admin: { id: user.id, name: user.name, email: user.email, role: user.adminRole }
        });
    } catch (error) {
        console.error('Administrator role assignment failed:', error.message);
        return res.status(500).json({ message: 'Unable to assign the administrator role' });
    }
});

router.put('/admins/:userId/role', requireRole('owner'), async (req, res) => {
    const { userId } = req.params;
    const role = req.body?.role;
    if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (
        Object.keys(req.body || {}).length !== 1 ||
        !Object.hasOwn(req.body, 'role') ||
        (role !== 'none' && !ADMIN_ROLES.includes(role))
    ) {
        return res.status(400).json({ message: 'Choose a valid administrator role' });
    }
    if (userId === req.authUser.id) {
        return res.status(409).json({ message: 'You cannot change your own administrator role' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.email === process.env.ADMIN_EMAIL?.trim().toLowerCase() || user.adminRole === 'owner') {
            return res.status(409).json({ message: 'The configured owner role cannot be changed here' });
        }
        const previousRole = user.adminRole || 'none';
        user.adminRole = role === 'none' ? null : role;
        user.isAdmin = role !== 'none';
        await user.save();
        await appendAdminAction({
            admin: req.authUser.id,
            actionType: 'admin_role_updated',
            targetUser: user.id,
            previousValue: previousRole,
            newValue: role
        });
        return res.json({
            admin: { id: user.id, name: user.name, email: user.email, role: user.adminRole }
        });
    } catch (error) {
        console.error('Administrator role update failed:', error.message);
        return res.status(500).json({ message: 'Unable to update the administrator role' });
    }
});

router.get('/actions-log', requireRole('owner', 'admin'), async (req, res) => {
    const pagination = parsePagination(req.query);
    if (!pagination) {
        return res.status(400).json({ message: 'Invalid pagination parameters' });
    }
    try {
        const logs = await AdminAction.find({ expiresAt: { $gt: new Date() } })
            .sort({ createdAt: -1 })
            .skip(pagination.offset)
            .limit(pagination.limit)
            .populate('admin', 'name email')
            .populate('targetUser', 'name email')
            .lean();
        return res.json({
            logs: logs.map((log) => ({
                id: log._id.toString(),
                actionType: log.actionType,
                previousValue: log.previousValue,
                newValue: log.newValue,
                createdAt: log.createdAt,
                admin: log.admin ? { name: log.admin.name, email: log.admin.email } : null,
                targetUser: log.targetUser
                    ? { name: log.targetUser.name, email: log.targetUser.email }
                    : null
            }))
        });
    } catch (error) {
        console.error('Admin action log retrieval failed:', error.message);
        return res.status(500).json({ message: 'Unable to load the administrator action log' });
    }
});

module.exports = router;
module.exports.parsePagination = parsePagination;
