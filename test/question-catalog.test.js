const test = require('node:test');
const assert = require('node:assert/strict');
const {
    loadQuestionnaire,
    parseCsv,
    readQuestionRecords,
    seedQuestionCatalog
} = require('../services/questionCatalog');

test('CSV parser supports quoted commas, escaped quotes, and embedded newlines', () => {
    const rows = parseCsv('id,text\r\n1,"A comma, a ""quote"",\nand a newline"\r\n');

    assert.deepEqual(rows, [{ id: '1', text: 'A comma, a "quote",\nand a newline' }]);
});

test('provided CSV files load the expected 101 records with no duplicate item keys', async () => {
    const records = await readQuestionRecords();
    const counts = Object.groupBy(records, ({ instrument }) => instrument);

    assert.equal(records.length, 101);
    assert.equal(counts.IPIP_NEO_SAMPLE.length, 50);
    assert.equal(counts.VIA_IS_R_SAMPLE.length, 30);
    assert.equal(counts.PHQ9.length, 9);
    assert.equal(counts.GAD7.length, 7);
    assert.equal(counts.NARRATIVE.length, 5);
    assert.equal(new Set(records.map(({ instrument, itemId }) => `${instrument}:${itemId}`)).size, 101);
});

test('question catalog seeding uses idempotent upserts and produces all assessment sections', async () => {
    const documents = new Map();
    const model = {
        async bulkWrite(operations) {
            let upsertedCount = 0;
            for (const { updateOne } of operations) {
                const key = `${updateOne.filter.instrument}:${updateOne.filter.itemId}`;
                if (!documents.has(key)) upsertedCount += 1;
                documents.set(key, updateOne.update.$set);
            }
            return { upsertedCount };
        },
        find() {
            return {
                sort() {
                    return {
                        lean: async () => [...documents.values()]
                    };
                }
            };
        }
    };

    const firstSeed = await seedQuestionCatalog(model);
    const secondSeed = await seedQuestionCatalog(model);
    const questionnaire = await loadQuestionnaire(model);

    assert.equal(firstSeed.questionCount, 101);
    assert.equal(firstSeed.upsertedCount, 101);
    assert.equal(secondSeed.upsertedCount, 0);
    assert.equal(documents.size, 101);
    assert.deepEqual(questionnaire.sections.map(({ id, items }) => [id, items.length]), [
        ['ipip', 50],
        ['via', 30],
        ['health', 16],
        ['narrative', 5]
    ]);

    const safetyItem = questionnaire.sections[2].items.find(
        ({ instrument, itemId }) => instrument === 'PHQ9' && itemId === 9
    );
    assert.equal(safetyItem.id, 'PHQ9:9');
});
