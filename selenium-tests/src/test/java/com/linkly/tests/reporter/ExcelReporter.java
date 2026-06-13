package com.linkly.tests.reporter;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.DefaultIndexedColorMap;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.File;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class ExcelReporter {

    public static class TestCaseDetails {
        public String id;
        public String module;
        public String screen;
        public String description;
        public String steps;
        public String expected;
        public String screenshotRef;

        public TestCaseDetails(String id, String module, String screen, String description, String steps, String expected, String screenshotRef) {
            this.id = id;
            this.module = module;
            this.screen = screen;
            this.description = description;
            this.steps = steps;
            this.expected = expected;
            this.screenshotRef = screenshotRef;
        }
    }

    private static final Map<String, TestCaseDetails> DETAILS_MAP = new HashMap<>();

    static {
        // Landing Page (index.html)
        DETAILS_MAP.put("TC_LAND_01_IndexPageTitle_shouldLoadAndMatchTitle", new TestCaseDetails(
            "TC-LAND-01", "TC-LANDING: Landing Page", "index.html",
            "Verify the landing page loads and matches the correct title",
            "1. Open index.html\n2. Get page title\n3. Assert title equals 'Linkly - Unified Web Suite'",
            "Title matches 'Linkly - Unified Web Suite'", "screenshots/TC-LAND-01.png"
        ));
        DETAILS_MAP.put("TC_LAND_02_IndexHeroHeading_shouldDisplayLinkly", new TestCaseDetails(
            "TC-LAND-02", "TC-LANDING: Landing Page", "index.html",
            "Verify hero section displays main heading 'Linkly'",
            "1. Open index.html\n2. Find element '.portal-hero h1'\n3. Assert text is 'Linkly'",
            "Hero heading displays 'Linkly'", "screenshots/TC-LAND-02.png"
        ));
        DETAILS_MAP.put("TC_LAND_03_IndexHeroLogo_shouldShowLinkEmoji", new TestCaseDetails(
            "TC-LAND-03", "TC-LANDING: Landing Page", "index.html",
            "Verify hero section contains the branding link emoji",
            "1. Open index.html\n2. Find element '.portal-logo'\n3. Assert text is '🔗'",
            "Logo emoji '🔗' is displayed", "screenshots/TC-LAND-03.png"
        ));
        DETAILS_MAP.put("TC_LAND_04_IndexHeroSubtitle_shouldDisplayDescription", new TestCaseDetails(
            "TC-LAND-04", "TC-LANDING: Landing Page", "index.html",
            "Verify hero section displays description of system features",
            "1. Open index.html\n2. Find element '.portal-hero p'\n3. Assert description contains target words",
            "Description is fully visible and contains features description", "screenshots/TC-LAND-04.png"
        ));
        DETAILS_MAP.put("TC_LAND_05_IndexParentPortalLink_shouldPointToParentHtml", new TestCaseDetails(
            "TC-LAND-05", "TC-LANDING: Landing Page", "index.html",
            "Verify Parent Portal card links to parent.html dashboard",
            "1. Open index.html\n2. Find element '.parent-card'\n3. Assert href points to 'parent.html'",
            "Card points to 'parent.html'", "screenshots/TC-LAND-05.png"
        ));
        DETAILS_MAP.put("TC_LAND_06_IndexChildCompanionLink_shouldPointToChildHtml", new TestCaseDetails(
            "TC-LAND-06", "TC-LANDING: Landing Page", "index.html",
            "Verify Child Companion card links to child.html status board",
            "1. Open index.html\n2. Find element '.child-card'\n3. Assert href points to 'child.html'",
            "Card points to 'child.html'", "screenshots/TC-LAND-06.png"
        ));
        DETAILS_MAP.put("TC_LAND_07_IndexParentPortalButton_shouldDisplayEnterDashboard", new TestCaseDetails(
            "TC-LAND-07", "TC-LANDING: Landing Page", "index.html",
            "Verify Parent Portal button displays correct call-to-action",
            "1. Open index.html\n2. Find button inside '.parent-card'\n3. Assert button text is 'Enter Dashboard'",
            "Button text displays 'Enter Dashboard'", "screenshots/TC-LAND-07.png"
        ));
        DETAILS_MAP.put("TC_LAND_08_IndexChildCompanionButton_shouldDisplayBootCompanion", new TestCaseDetails(
            "TC-LAND-08", "TC-LANDING: Landing Page", "index.html",
            "Verify Child Companion button displays correct call-to-action",
            "1. Open index.html\n2. Find button inside '.child-card'\n3. Assert button text is 'Boot Companion'",
            "Button text displays 'Boot Companion'", "screenshots/TC-LAND-08.png"
        ));

        // Parent Portal (parent.html)
        DETAILS_MAP.put("TC_PAR_01_ParentPortalTitle_shouldMatchParentDashboardTitle", new TestCaseDetails(
            "TC-PAR-01", "TC-PARENT: Parent Portal", "parent.html",
            "Verify parent dashboard title matches specifications",
            "1. Open parent.html\n2. Retrieve page title\n3. Assert title is 'Linkly - Real-Time Parent Dashboard'",
            "Title is 'Linkly - Real-Time Parent Dashboard'", "screenshots/TC-PAR-01.png"
        ));
        DETAILS_MAP.put("TC_PAR_02_ExitButton_shouldRedirectToIndexPage", new TestCaseDetails(
            "TC-PAR-02", "TC-PARENT: Parent Portal", "parent.html",
            "Verify exit/logout button redirects to main index portal selector",
            "1. Open parent.html\n2. Click exit button link\n3. Assert page redirected to 'index.html'",
            "Redirection to 'index.html' is successful", "screenshots/TC-PAR-02.png"
        ));
        DETAILS_MAP.put("TC_PAR_03_SidebarBrandLogo_shouldDisplayBrandEmoji", new TestCaseDetails(
            "TC-PAR-03", "TC-PARENT: Parent Portal", "parent.html",
            "Verify parent portal sidebar displays branding emoji",
            "1. Open parent.html\n2. Find brand logo in sidebar\n3. Assert text is '🔗'",
            "Branding logo emoji '🔗' is present", "screenshots/TC-PAR-03.png"
        ));
        DETAILS_MAP.put("TC_PAR_04_SidebarBrandName_shouldDisplayLinkly", new TestCaseDetails(
            "TC-PAR-04", "TC-PARENT: Parent Portal", "parent.html",
            "Verify parent portal sidebar displays branding name 'Linkly'",
            "1. Open parent.html\n2. Find brand name header in sidebar\n3. Assert text is 'Linkly'",
            "Branding name is 'Linkly'", "screenshots/TC-PAR-04.png"
        ));
        DETAILS_MAP.put("TC_PAR_05_NavDashboard_shouldDisplayDashboardTab", new TestCaseDetails(
            "TC-PAR-05", "TC-PARENT: Parent Portal", "parent.html",
            "Verify sidebar navigation menu contains dashboard tab",
            "1. Open parent.html\n2. Find nav item button with tab 'dashboard'\n3. Assert label contains 'Dashboard'",
            "Dashboard nav item is displayed and active by default", "screenshots/TC-PAR-05.png"
        ));
        DETAILS_MAP.put("TC_PAR_06_NavLiveTracker_shouldDisplayLiveTrackerTab", new TestCaseDetails(
            "TC-PAR-06", "TC-PARENT: Parent Portal", "parent.html",
            "Verify sidebar navigation menu contains live tracker maps tab",
            "1. Open parent.html\n2. Find nav item button with tab 'map'\n3. Assert label contains 'Live Tracker'",
            "Live Tracker nav item is displayed", "screenshots/TC-PAR-06.png"
        ));
        DETAILS_MAP.put("TC_PAR_07_NavScreenTime_shouldDisplayScreenTimeTab", new TestCaseDetails(
            "TC-PAR-07", "TC-PARENT: Parent Portal", "parent.html",
            "Verify sidebar navigation menu contains screen time tab",
            "1. Open parent.html\n2. Find nav item button with tab 'screentime'\n3. Assert label contains 'Screen Time'",
            "Screen Time nav item is displayed", "screenshots/TC-PAR-07.png"
        ));
        DETAILS_MAP.put("TC_PAR_08_NavAppManager_shouldDisplayAppManagerTab", new TestCaseDetails(
            "TC-PAR-08", "TC-PARENT: Parent Portal", "parent.html",
            "Verify sidebar navigation menu contains app manager tab",
            "1. Open parent.html\n2. Find nav item button with tab 'apps'\n3. Assert label contains 'App Manager'",
            "App Manager nav item is displayed", "screenshots/TC-PAR-08.png"
        ));
        DETAILS_MAP.put("TC_PAR_09_DeviceLockdownCard_shouldDisplayLockdownHeading", new TestCaseDetails(
            "TC-PAR-09", "TC-PARENT: Parent Portal", "parent.html",
            "Verify Device Lockdown control card is visible",
            "1. Open parent.html\n2. Locate lockdown card\n3. Assert header is 'Device Lockdown'",
            "Card title matches 'Device Lockdown'", "screenshots/TC-PAR-09.png"
        ));
        DETAILS_MAP.put("TC_PAR_10_TelemetryStateCard_shouldDisplayTelemetryHeading", new TestCaseDetails(
            "TC-PAR-10", "TC-PARENT: Parent Portal", "parent.html",
            "Verify Telemetry State info card is visible",
            "1. Open parent.html\n2. Locate status telemetry card\n3. Assert header is 'Telemetry State'",
            "Card title matches 'Telemetry State'", "screenshots/TC-PAR-10.png"
        ));
        DETAILS_MAP.put("TC_PAR_11_RealTimeGpsCard_shouldDisplayMapFrame", new TestCaseDetails(
            "TC-PAR-11", "TC-PARENT: Parent Portal", "parent.html",
            "Verify Leaflet Map frame is rendered successfully",
            "1. Open parent.html\n2. Find map frame with id 'miniMap'\n3. Assert map frame is visible",
            "Map frame is displayed on dashboard", "screenshots/TC-PAR-11.png"
        ));
        DETAILS_MAP.put("TC_PAR_12_ScreenTimeProgressCard_shouldDisplayProgressHeading", new TestCaseDetails(
            "TC-PAR-12", "TC-PARENT: Parent Portal", "parent.html",
            "Verify screen time progress monitoring bar is visible",
            "1. Open parent.html\n2. Locate screentime progress card\n3. Assert header is 'Screen Time Progress'",
            "Card title matches 'Screen Time Progress'", "screenshots/TC-PAR-12.png"
        ));

        // Child Companion (child.html)
        DETAILS_MAP.put("TC_CHILD_01_ChildTitle_shouldMatchChildCompanionTitle", new TestCaseDetails(
            "TC-CHILD-01", "TC-CHILD: Child Companion", "child.html",
            "Verify child companion page title matches specifications",
            "1. Open child.html\n2. Retrieve page title\n3. Assert title is 'Linkly - Child Companion Node'",
            "Title is 'Linkly - Child Companion Node'", "screenshots/TC-CHILD-01.png"
        ));
        DETAILS_MAP.put("TC_CHILD_02_ChildHeaderName_shouldDisplayChildDevice", new TestCaseDetails(
            "TC-CHILD-02", "TC-CHILD: Child Companion", "child.html",
            "Verify child companion displays header title 'Child Device'",
            "1. Open child.html\n2. Find label with id 'childHeaderName'\n3. Assert text is 'Child Device'",
            "Header label displays 'Child Device'", "screenshots/TC-CHILD-02.png"
        ));
        DETAILS_MAP.put("TC_CHILD_03_AllocatedScreenTimeCard_shouldDisplayScreentimeHeading", new TestCaseDetails(
            "TC-CHILD-03", "TC-CHILD: Child Companion", "child.html",
            "Verify Allocated Screen Time status widget is visible",
            "1. Open child.html\n2. Find card heading inside screentime block\n3. Assert text is 'Allocated Screen Time'",
            "Card title matches 'Allocated Screen Time'", "screenshots/TC-CHILD-03.png"
        ));
        DETAILS_MAP.put("TC_CHILD_04_BrainMathQuizCard_shouldDisplayQuizHeading", new TestCaseDetails(
            "TC-CHILD-04", "TC-CHILD: Child Companion", "child.html",
            "Verify Brain Math Quiz widget is visible",
            "1. Open child.html\n2. Find math quiz header element\n3. Assert text contains 'Brain Math Quiz'",
            "Card title matches 'Brain Math Quiz'", "screenshots/TC-CHILD-04.png"
        ));
        DETAILS_MAP.put("TC_CHILD_05_HardwareStatusSimulatorCard_shouldDisplaySimulatorHeading", new TestCaseDetails(
            "TC-CHILD-05", "TC-CHILD: Child Companion", "child.html",
            "Verify Hardware Status Simulator control panel is visible",
            "1. Open child.html\n2. Find playground card simulator heading\n3. Assert text is 'Hardware Status Simulator'",
            "Card title matches 'Hardware Status Simulator'", "screenshots/TC-CHILD-05.png"
        ));
    }

    public static void main(String[] args) {
        try {
            System.out.println("ExcelReporter: Starting Excel report generation for Selenium UI tests...");
            File testResultsDir = new File("selenium-tests/build/test-results/test");
            File reportsDir = new File("reports");
            if (!reportsDir.exists()) {
                reportsDir.mkdirs();
            }
            File reportFile = new File(reportsDir, "Selenium_UI_Report.xlsx");

            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Selenium UI Report");

            // Define Fonts
            Font titleFont = workbook.createFont();
            titleFont.setFontName("Segoe UI");
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setBold(true);

            Font headerFont = workbook.createFont();
            headerFont.setFontName("Segoe UI");
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            Font normalFont = workbook.createFont();
            normalFont.setFontName("Segoe UI");
            normalFont.setFontHeightInPoints((short) 10);

            Font boldFont = workbook.createFont();
            boldFont.setFontName("Segoe UI");
            boldFont.setFontHeightInPoints((short) 10);
            boldFont.setBold(true);

            Font passFont = workbook.createFont();
            passFont.setFontName("Segoe UI");
            passFont.setFontHeightInPoints((short) 10);
            passFont.setBold(true);
            passFont.setColor(new XSSFColor(new java.awt.Color(46, 125, 50), new DefaultIndexedColorMap()).getIndex());

            Font failFont = workbook.createFont();
            failFont.setFontName("Segoe UI");
            failFont.setFontHeightInPoints((short) 10);
            failFont.setBold(true);
            failFont.setColor(new XSSFColor(new java.awt.Color(198, 40, 40), new DefaultIndexedColorMap()).getIndex());

            // Define Cell Styles
            XSSFCellStyle titleStyle = (XSSFCellStyle) workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            titleStyle.setFillForegroundColor(new XSSFColor(new java.awt.Color(236, 239, 241), new DefaultIndexedColorMap()));
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            titleStyle.setBorderBottom(BorderStyle.MEDIUM);
            titleStyle.setBorderTop(BorderStyle.MEDIUM);
            titleStyle.setBorderLeft(BorderStyle.MEDIUM);
            titleStyle.setBorderRight(BorderStyle.MEDIUM);

            XSSFCellStyle headerStyle = (XSSFCellStyle) workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(new XSSFColor(new java.awt.Color(27, 54, 93), new DefaultIndexedColorMap()));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            XSSFCellStyle labelStyle = (XSSFCellStyle) workbook.createCellStyle();
            labelStyle.setFont(boldFont);
            labelStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            XSSFCellStyle valStyle = (XSSFCellStyle) workbook.createCellStyle();
            valStyle.setFont(normalFont);
            valStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            XSSFCellStyle failValStyle = (XSSFCellStyle) workbook.createCellStyle();
            failValStyle.setFont(boldFont);
            failValStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            failValStyle.setFont(failFont);

            XSSFCellStyle normalCellStyle = (XSSFCellStyle) workbook.createCellStyle();
            normalCellStyle.setFont(normalFont);
            normalCellStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            normalCellStyle.setBorderBottom(BorderStyle.THIN);
            normalCellStyle.setBorderTop(BorderStyle.THIN);
            normalCellStyle.setBorderLeft(BorderStyle.THIN);
            normalCellStyle.setBorderRight(BorderStyle.THIN);
            normalCellStyle.setWrapText(true);

            XSSFCellStyle passStatusStyle = (XSSFCellStyle) workbook.createCellStyle();
            passStatusStyle.setFont(passFont);
            passStatusStyle.setAlignment(HorizontalAlignment.CENTER);
            passStatusStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            passStatusStyle.setFillForegroundColor(new XSSFColor(new java.awt.Color(232, 245, 233), new DefaultIndexedColorMap()));
            passStatusStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            passStatusStyle.setBorderBottom(BorderStyle.THIN);
            passStatusStyle.setBorderTop(BorderStyle.THIN);
            passStatusStyle.setBorderLeft(BorderStyle.THIN);
            passStatusStyle.setBorderRight(BorderStyle.THIN);

            XSSFCellStyle failStatusStyle = (XSSFCellStyle) workbook.createCellStyle();
            failStatusStyle.setFont(failFont);
            failStatusStyle.setAlignment(HorizontalAlignment.CENTER);
            failStatusStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            failStatusStyle.setFillForegroundColor(new XSSFColor(new java.awt.Color(255, 235, 238), new DefaultIndexedColorMap()));
            failStatusStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            failStatusStyle.setBorderBottom(BorderStyle.THIN);
            failStatusStyle.setBorderTop(BorderStyle.THIN);
            failStatusStyle.setBorderLeft(BorderStyle.THIN);
            failStatusStyle.setBorderRight(BorderStyle.THIN);

            // Create title block (Row 0)
            Row titleRow = sheet.createRow(0);
            titleRow.setHeightInPoints(40);
            for (int i = 0; i < 11; i++) {
                titleRow.createCell(i).setCellStyle(titleStyle);
            }
            titleRow.getCell(0).setCellValue("Selenium Test Execution Report");
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));

            // Parse Results
            int totalTests = 0;
            int passedTests = 0;
            int failedTests = 0;
            double totalDurationSec = 0.0;
            SimpleDateFormat defaultDateFormat = new SimpleDateFormat("M/d/yyyy, h:mm:ss a");

            if (testResultsDir.exists() && testResultsDir.isDirectory()) {
                File[] xmlFiles = testResultsDir.listFiles((dir, name) -> name.endsWith(".xml"));
                if (xmlFiles != null) {
                    int currentRowNum = 8;
                    for (File xmlFile : xmlFiles) {
                        DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
                        DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
                        Document doc = dBuilder.parse(xmlFile);
                        doc.getDocumentElement().normalize();

                        NodeList nList = doc.getElementsByTagName("testcase");
                        for (int temp = 0; temp < nList.getLength(); temp++) {
                            org.w3c.dom.Node nNode = nList.item(temp);
                            if (nNode.getNodeType() == org.w3c.dom.Node.ELEMENT_NODE) {
                                Element eElement = (Element) nNode;
                                String rawName = eElement.getAttribute("name");
                                String cleanedMethodName = rawName.replace("()", "");
                                TestCaseDetails details = DETAILS_MAP.get(cleanedMethodName);

                                if (details == null) {
                                    details = new TestCaseDetails("TC-WEB-UI", "TC-WEB: Web App", "webapp", cleanedMethodName, "N/A", "N/A", "N/A");
                                }

                                String timeStr = eElement.getAttribute("time");
                                double timeVal = 0.0;
                                try {
                                    timeVal = Double.parseDouble(timeStr);
                                } catch (NumberFormatException ignored) {}
                                totalDurationSec += timeVal;
                                String timeMsStr = ((int) (timeVal * 1000)) + "ms";

                                NodeList failures = eElement.getElementsByTagName("failure");
                                NodeList errors = eElement.getElementsByTagName("error");
                                boolean isPassed = (failures.getLength() == 0 && errors.getLength() == 0);

                                totalTests++;
                                if (isPassed) {
                                    passedTests++;
                                } else {
                                    failedTests++;
                                }

                                String status = isPassed ? "Pass" : "Fail";
                                String errorMsg = "";
                                if (!isPassed) {
                                    if (failures.getLength() > 0) {
                                        errorMsg = ((Element) failures.item(0)).getAttribute("message");
                                    } else if (errors.getLength() > 0) {
                                        errorMsg = ((Element) errors.item(0)).getAttribute("message");
                                    }
                                }

                                String suiteTimestamp = doc.getDocumentElement().getAttribute("timestamp");
                                String dateTimeVal = "";
                                try {
                                    SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
                                    Date date = inputFormat.parse(suiteTimestamp);
                                    dateTimeVal = defaultDateFormat.format(date);
                                } catch (Exception e) {
                                    dateTimeVal = defaultDateFormat.format(new Date());
                                }

                                Row row = sheet.createRow(currentRowNum++);
                                row.setHeightInPoints(24);
                                row.createCell(0).setCellValue(details.id);
                                row.createCell(1).setCellValue(details.module);
                                row.createCell(2).setCellValue(details.screen);
                                row.createCell(3).setCellValue(details.description);
                                row.createCell(4).setCellValue(details.steps);
                                row.createCell(5).setCellValue(details.expected);
                                row.createCell(6).setCellValue(isPassed ? "Expected UI elements loaded successfully." : "Error: " + errorMsg);
                                row.createCell(7).setCellValue(timeMsStr);
                                
                                Cell statusCell = row.createCell(8);
                                statusCell.setCellValue(status);
                                statusCell.setCellStyle(isPassed ? passStatusStyle : failStatusStyle);

                                row.createCell(9).setCellValue(details.screenshotRef);
                                row.createCell(10).setCellValue(dateTimeVal);

                                for (int i = 0; i < 11; i++) {
                                    if (i != 8) {
                                        row.getCell(i).setCellStyle(normalCellStyle);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Create summary fields (Rows 2 to 5)
            Row row2 = sheet.createRow(2);
            row2.createCell(0).setCellValue("Total Tests");
            row2.createCell(2).setCellValue(totalTests);
            row2.getCell(0).setCellStyle(labelStyle);
            row2.getCell(2).setCellStyle(valStyle);

            Row row3 = sheet.createRow(3);
            row3.createCell(0).setCellValue("Passed");
            row3.createCell(2).setCellValue(passedTests);
            row3.getCell(0).setCellStyle(labelStyle);
            row3.getCell(2).setCellStyle(valStyle);

            Row row4 = sheet.createRow(4);
            row4.createCell(0).setCellValue("Failed");
            row4.createCell(2).setCellValue(failedTests);
            row4.getCell(0).setCellStyle(labelStyle);
            row4.getCell(2).setCellStyle(failedTests > 0 ? failValStyle : valStyle);

            Row row5 = sheet.createRow(5);
            row5.createCell(0).setCellValue("Total Duration");
            double formattedDuration = Math.round(totalDurationSec * 100.0) / 100.0;
            row5.createCell(1).setCellValue(formattedDuration + "s");
            row5.getCell(0).setCellStyle(labelStyle);
            row5.getCell(1).setCellStyle(valStyle);

            // Create headers (Row 7)
            Row headerRow = sheet.createRow(7);
            headerRow.setHeightInPoints(28);
            String[] headers = {
                "Test Case ID", "Module", "Screen/Endpoint", "Description",
                "Steps Executed", "Expected Result", "Actual Result",
                "Execution Time", "Status", "Screenshot Reference", "Timestamp"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Autosize columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                // Adjust width if too narrow or too wide
                int width = sheet.getColumnWidth(i);
                if (width < 3500) {
                    sheet.setColumnWidth(i, 3500);
                } else if (width > 12000) {
                    sheet.setColumnWidth(i, 12000);
                }
            }

            FileOutputStream fileOut = new FileOutputStream(reportFile);
            workbook.write(fileOut);
            fileOut.close();
            workbook.close();
            System.out.println("ExcelReporter: Styled report generated successfully at: " + reportFile.getAbsolutePath());

        } catch (Exception e) {
            System.err.println("ExcelReporter: Error generating report: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
