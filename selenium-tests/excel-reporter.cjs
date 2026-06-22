const Mocha = require('mocha');
const ExcelJS = require('exceljs');
const { EVENT_TEST_PASS, EVENT_TEST_FAIL, EVENT_RUN_END } = Mocha.Runner.constants;

class ExcelReporter {
    constructor(runner) {
        this.results = [];
        this.executed = 0;
        this.startTime = Date.now();

        runner.on(EVENT_TEST_PASS, (test) => {
            this.executed++;
            const t = test.duration || 0;
            console.log(`\x1b[32m✔\x1b[0m ${this.parseId(test.title)} : ${this.parseScenario(test.title)} (${t}ms)`);
            this.results.push({ test, status: 'PASS', time: t });
        });

        runner.on(EVENT_TEST_FAIL, (test, err) => {
            this.executed++;
            const t = test.duration || 0;
            console.log(`\x1b[31m✘\x1b[0m ${this.parseId(test.title)} : ${this.parseScenario(test.title)} (${t}ms) - ${err.message}`);
            this.results.push({ test, status: 'FAIL', time: t });
        });

        runner.on(EVENT_RUN_END, async () => {
            console.log(`\nProgress : ${this.executed}/300`);
            const passed = this.results.filter(r => r.status === 'PASS').length;
            console.log(`\n${passed} passing`);
            console.log(`Execution Time : ${Math.round((Date.now() - this.startTime)/1000)} sec`);
            await this.generateExcel();
        });
    }

    parseId(title) {
        const parts = title.split('_');
        if (parts.length >= 3) return `${parts[0]}-${parts[1]}-${parts[2]}`;
        return title;
    }

    parseScenario(title) {
        const parts = title.split('_');
        if (parts.length >= 6) return parts[5].replace(/X/g, ' ');
        return title;
    }

    async generateExcel() {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Test Results');
        
        sheet.mergeCells('A1:B1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'Test Execution Summary';
        titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
        titleCell.alignment = { horizontal: 'center' };

        const passedCount = this.results.filter(r => r.status === 'PASS').length;
        const failedCount = this.results.filter(r => r.status === 'FAIL').length;
        const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);

        sheet.getCell('A3').value = 'Total Tests';
        sheet.getCell('B3').value = this.executed;
        sheet.getCell('A3').font = { bold: true };
        sheet.getCell('B3').font = { bold: true };

        sheet.getCell('A4').value = 'Passed';
        sheet.getCell('B4').value = passedCount;
        sheet.getCell('A4').font = { bold: true };
        sheet.getCell('B4').font = { bold: true, color: { argb: 'FF00B050' } };

        sheet.getCell('A5').value = 'Failed';
        sheet.getCell('B5').value = failedCount;
        sheet.getCell('A5').font = { bold: true };
        sheet.getCell('B5').font = { bold: true, color: { argb: 'FFFF0000' } };

        sheet.getCell('A6').value = 'Total Duration';
        sheet.getCell('B6').value = `${totalDuration}s`;
        sheet.getCell('A6').font = { bold: true };
        sheet.getCell('B6').font = { bold: true };

        const headerRow = sheet.getRow(8);
        headerRow.values = ['Test Case ID', 'Module', 'Scenario Name', 'Expected Result', 'Status', 'Execution Time'];
        headerRow.font = { bold: true };

        sheet.getColumn(1).width = 20;
        sheet.getColumn(2).width = 25;
        sheet.getColumn(3).width = 45;
        sheet.getColumn(4).width = 45;
        sheet.getColumn(5).width = 10;
        sheet.getColumn(6).width = 15;

        let rowIdx = 9;
        this.results.forEach(r => {
            const p = r.test.title.split('_');
            if(p.length >= 7) {
                sheet.getRow(rowIdx).values = [
                    `${p[0]}-${p[1]}-${p[2]}`,
                    p[3].replace(/X/g, ' '),
                    p[5].replace(/X/g, ' '),
                    p[6].replace(/X/g, ' '),
                    r.status,
                    `${r.time}ms`
                ];
            } else {
                sheet.getRow(rowIdx).values = [r.test.title, 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', r.status, `${r.time}ms`];
            }
            rowIdx++;
        });

        await workbook.xlsx.writeFile('reports/Selenium_UI_Report.xlsx');
    }
}

module.exports = ExcelReporter;
