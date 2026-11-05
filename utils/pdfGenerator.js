const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// دالة لتوليد ملف PDF وتنسيقه
async function createPDFBooklet(bookData, userName, outputPath, language = 'ar') {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(outputPath);
        const english = language === 'en';
        
        doc.pipe(stream);

        // هنا سنضيف خط عربي (يجب تنزيل ملف خط مثل Cairo أو Arial.ttf لاحقاً)
        // doc.font('path/to/arabic/font.ttf');

        // صفحة الغلاف
        doc.fontSize(28).text(bookData.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text(
            english
                ? `Prepared for: ${userName || 'the reader'}`
                : `تم إعداده خصيصاً لـ: ${userName || 'القارئ'}`,
            { align: 'center' }
        );
        doc.moveDown(5);
        doc.fontSize(12).text(
            english ? 'A self-reflection guide' : 'دليل للتأمل الذاتي',
            { align: 'center' }
        );
        
        doc.addPage();

        // دوال مساعدة لطباعة الفصول
        const printChapter = (title, content) => {
            doc.fontSize(20).text(title, { underline: true });
            doc.moveDown();
            doc.fontSize(14).text(content, { align: english ? 'left' : 'right', width: 450 });
            doc.addPage();
        };

        const chapters = english
            ? [
                'Chapter 1: Your response patterns',
                'Chapter 2: Context and reflection',
                'Chapter 3: Resources you identified',
                'Chapter 4: A pause for reflection',
                'Chapter 5: A small experiment'
            ]
            : [
                'الفصل الأول: ملامح إجاباتك',
                'الفصل الثاني: السياق والتأمل',
                'الفصل الثالث: الموارد التي حددتها',
                'الفصل الرابع: وقفة للتأمل',
                'الفصل الخامس: تجربة صغيرة'
            ];
        printChapter(chapters[0], bookData.chapter1_mirror);
        printChapter(chapters[1], bookData.chapter2_diagnosis);
        printChapter(chapters[2], bookData.chapter3_history);
        printChapter(chapters[3], bookData.chapter4_literature);
        printChapter(chapters[4], bookData.chapter5_roadmap);

        // إنهاء الـ PDF
        doc.end();

        stream.on('finish', () => {
            resolve(outputPath);
        });
        stream.on('error', reject);
    });
}

module.exports = { createPDFBooklet };
