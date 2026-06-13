package com.linkly.tests;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import java.io.File;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class LinklyWebUiTest {
    private WebDriver driver;

    @BeforeEach
    public void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        driver = new ChromeDriver(options);
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    private String getIndexPageUrl() {
        File htmlFile = new File("web_parent_dashboard/index.html");
        if (!htmlFile.exists()) {
            htmlFile = new File("../web_parent_dashboard/index.html");
        }
        assertTrue(htmlFile.exists(), "index.html path resolved incorrectly");
        return htmlFile.toURI().toString();
    }

    private String getParentPageUrl() {
        File htmlFile = new File("web_parent_dashboard/parent.html");
        if (!htmlFile.exists()) {
            htmlFile = new File("../web_parent_dashboard/parent.html");
        }
        assertTrue(htmlFile.exists(), "parent.html path resolved incorrectly");
        return htmlFile.toURI().toString();
    }

    private String getChildPageUrl() {
        File htmlFile = new File("web_parent_dashboard/child.html");
        if (!htmlFile.exists()) {
            htmlFile = new File("../web_parent_dashboard/child.html");
        }
        assertTrue(htmlFile.exists(), "child.html path resolved incorrectly");
        return htmlFile.toURI().toString();
    }

    // ==========================================
    // LANDING PAGE TESTS (TC-LAND-01 to TC-LAND-08)
    // ==========================================

    @Test
    public void TC_LAND_01_IndexPageTitle_shouldLoadAndMatchTitle() {
        driver.get(getIndexPageUrl());
        assertEquals("Linkly - Unified Web Suite", driver.getTitle());
    }

    @Test
    public void TC_LAND_02_IndexHeroHeading_shouldDisplayLinkly() {
        driver.get(getIndexPageUrl());
        WebElement heading = driver.findElement(By.cssSelector(".portal-hero h1"));
        assertEquals("Linkly", heading.getAttribute("textContent"));
    }

    @Test
    public void TC_LAND_03_IndexHeroLogo_shouldShowLinkEmoji() {
        driver.get(getIndexPageUrl());
        WebElement logo = driver.findElement(By.className("portal-logo"));
        assertEquals("🔗", logo.getText());
    }

    @Test
    public void TC_LAND_04_IndexHeroSubtitle_shouldDisplayDescription() {
        driver.get(getIndexPageUrl());
        WebElement desc = driver.findElement(By.cssSelector(".portal-hero p"));
        assertTrue(desc.getText().contains("supervising, tracking, and protecting"));
    }

    @Test
    public void TC_LAND_05_IndexParentPortalLink_shouldPointToParentHtml() {
        driver.get(getIndexPageUrl());
        WebElement parentCard = driver.findElement(By.className("parent-card"));
        String href = parentCard.getAttribute("href");
        assertTrue(href.endsWith("parent.html"));
    }

    @Test
    public void TC_LAND_06_IndexChildCompanionLink_shouldPointToChildHtml() {
        driver.get(getIndexPageUrl());
        WebElement childCard = driver.findElement(By.className("child-card"));
        String href = childCard.getAttribute("href");
        assertTrue(href.endsWith("child.html"));
    }

    @Test
    public void TC_LAND_07_IndexParentPortalButton_shouldDisplayEnterDashboard() {
        driver.get(getIndexPageUrl());
        WebElement btn = driver.findElement(By.cssSelector(".parent-card button"));
        assertEquals("Enter Dashboard", btn.getText());
    }

    @Test
    public void TC_LAND_08_IndexChildCompanionButton_shouldDisplayBootCompanion() {
        driver.get(getIndexPageUrl());
        WebElement btn = driver.findElement(By.cssSelector(".child-card button"));
        assertEquals("Boot Companion", btn.getText());
    }

    // ==========================================
    // PARENT PORTAL DASHBOARD TESTS (TC-PAR-01 to TC-PAR-12)
    // ==========================================

    @Test
    public void TC_PAR_01_ParentPortalTitle_shouldMatchParentDashboardTitle() {
        driver.get(getParentPageUrl());
        assertEquals("Linkly - Real-Time Parent Dashboard", driver.getTitle());
    }

    @Test
    public void TC_PAR_02_ExitButton_shouldRedirectToIndexPage() {
        driver.get(getParentPageUrl());
        WebElement exitBtn = driver.findElement(By.linkText("🚪 Exit"));
        exitBtn.click();
        assertTrue(driver.getCurrentUrl().endsWith("index.html"));
    }

    @Test
    public void TC_PAR_03_SidebarBrandLogo_shouldDisplayBrandEmoji() {
        driver.get(getParentPageUrl());
        WebElement logo = driver.findElement(By.className("brand-logo"));
        assertEquals("🔗", logo.getText());
    }

    @Test
    public void TC_PAR_04_SidebarBrandName_shouldDisplayLinkly() {
        driver.get(getParentPageUrl());
        WebElement name = driver.findElement(By.className("brand-name"));
        assertEquals("Linkly", name.getText());
    }

    @Test
    public void TC_PAR_05_NavDashboard_shouldDisplayDashboardTab() {
        driver.get(getParentPageUrl());
        WebElement navItem = driver.findElement(By.xpath("//button[@data-tab='dashboard']"));
        assertTrue(navItem.getText().contains("Dashboard"));
    }

    @Test
    public void TC_PAR_06_NavLiveTracker_shouldDisplayLiveTrackerTab() {
        driver.get(getParentPageUrl());
        WebElement navItem = driver.findElement(By.xpath("//button[@data-tab='map']"));
        assertTrue(navItem.getText().contains("Live Tracker"));
    }

    @Test
    public void TC_PAR_07_NavScreenTime_shouldDisplayScreenTimeTab() {
        driver.get(getParentPageUrl());
        WebElement navItem = driver.findElement(By.xpath("//button[@data-tab='screentime']"));
        assertTrue(navItem.getText().contains("Screen Time"));
    }

    @Test
    public void TC_PAR_08_NavAppManager_shouldDisplayAppManagerTab() {
        driver.get(getParentPageUrl());
        WebElement navItem = driver.findElement(By.xpath("//button[@data-tab='apps']"));
        assertTrue(navItem.getText().contains("App Manager"));
    }

    @Test
    public void TC_PAR_09_DeviceLockdownCard_shouldDisplayLockdownHeading() {
        driver.get(getParentPageUrl());
        WebElement heading = driver.findElement(By.xpath("//div[contains(@class, 'lockdown-card')]//h3"));
        assertEquals("Device Lockdown", heading.getText());
    }

    @Test
    public void TC_PAR_10_TelemetryStateCard_shouldDisplayTelemetryHeading() {
        driver.get(getParentPageUrl());
        WebElement heading = driver.findElement(By.xpath("//div[contains(@class, 'status-card')]//h3"));
        assertEquals("Telemetry State", heading.getText());
    }

    @Test
    public void TC_PAR_11_RealTimeGpsCard_shouldDisplayMapFrame() {
        driver.get(getParentPageUrl());
        WebElement miniMap = driver.findElement(By.id("miniMap"));
        assertTrue(miniMap.isDisplayed());
    }

    @Test
    public void TC_PAR_12_ScreenTimeProgressCard_shouldDisplayProgressHeading() {
        driver.get(getParentPageUrl());
        WebElement heading = driver.findElement(By.xpath("//div[contains(@class, 'screentime-card')]//h3"));
        assertEquals("Screen Time Progress", heading.getText());
    }



    // ==========================================
    // CHILD COMPANION DASHBOARD TESTS (TC-CHILD-01 to TC-CHILD-05)
    // ==========================================

    @Test
    public void TC_CHILD_01_ChildTitle_shouldMatchChildCompanionTitle() {
        driver.get(getChildPageUrl());
        assertEquals("Linkly - Child Companion Node", driver.getTitle());
    }

    @Test
    public void TC_CHILD_02_ChildHeaderName_shouldDisplayChildDevice() {
        driver.get(getChildPageUrl());
        WebElement headerName = driver.findElement(By.id("childHeaderName"));
        assertEquals("Child Device", headerName.getText());
    }

    @Test
    public void TC_CHILD_03_AllocatedScreenTimeCard_shouldDisplayScreentimeHeading() {
        driver.get(getChildPageUrl());
        WebElement heading = driver.findElement(By.xpath("//div[contains(@class, 'screentime-card')]//h3"));
        assertEquals("Allocated Screen Time", heading.getText());
    }

    @Test
    public void TC_CHILD_04_BrainMathQuizCard_shouldDisplayQuizHeading() {
        driver.get(getChildPageUrl());
        WebElement heading = driver.findElement(By.xpath("//h3[contains(text(), 'Brain Math Quiz')]"));
        assertEquals("Brain Math Quiz", heading.getText());
    }

    @Test
    public void TC_CHILD_05_HardwareStatusSimulatorCard_shouldDisplaySimulatorHeading() {
        driver.get(getChildPageUrl());
        WebElement heading = driver.findElement(By.xpath("//div[contains(@class, 'playground-card')]//h3"));
        assertEquals("Hardware Status Simulator", heading.getText());
    }
}
