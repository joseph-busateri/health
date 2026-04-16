# Phase 23 Unified Health Endpoints Test Script
# Tests all 5 unified health endpoints with sample user ID

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$UserId = "test-user-123",
    [string]$Date = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 23 Unified Health Endpoints Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$dateParam = if ($Date) { "?date=$Date" } else { "" }

# Test 1: Health Check
Write-Host "[1/6] Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get
    Write-Host "✅ Health Check: PASSED" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Get Unified Snapshot
Write-Host "[2/6] Testing Unified Snapshot..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/unified-health/$UserId$dateParam" -Method Get
    Write-Host "✅ Unified Snapshot: PASSED" -ForegroundColor Green
    Write-Host "   Sources Available: $($response.snapshot.dataQuality.sourcesAvailable)" -ForegroundColor Gray
    Write-Host "   Completeness: $($response.snapshot.dataQuality.completeness)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Unified Snapshot: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Correlations
Write-Host "[3/6] Testing Correlations..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/unified-health/$UserId/correlations$dateParam" -Method Get
    Write-Host "✅ Correlations: PASSED" -ForegroundColor Green
    Write-Host "   Total Correlations: $($response.analysis.summary.totalCorrelations)" -ForegroundColor Gray
    Write-Host "   Critical: $($response.analysis.summary.criticalCount)" -ForegroundColor Gray
    Write-Host "   Warnings: $($response.analysis.summary.warningCount)" -ForegroundColor Gray
    Write-Host "   Info: $($response.analysis.summary.infoCount)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Correlations: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Data Quality
Write-Host "[4/6] Testing Data Quality..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/unified-health/$UserId/data-quality$dateParam" -Method Get
    Write-Host "✅ Data Quality: PASSED" -ForegroundColor Green
    Write-Host "   Sources: $($response.dataQuality.sourcesAvailable)/$($response.dataQuality.totalSources)" -ForegroundColor Gray
    Write-Host "   Completeness: $([math]::Round($response.dataQuality.completeness * 100, 1))%" -ForegroundColor Gray
} catch {
    Write-Host "❌ Data Quality: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get Complete Snapshot
Write-Host "[5/6] Testing Complete Snapshot (Snapshot + Correlations)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/unified-health/$UserId/complete$dateParam" -Method Get
    Write-Host "✅ Complete Snapshot: PASSED" -ForegroundColor Green
    Write-Host "   Has Snapshot: $($null -ne $response.snapshot)" -ForegroundColor Gray
    Write-Host "   Has Correlations: $($null -ne $response.correlations)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Complete Snapshot: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get Source Summary
Write-Host "[6/6] Testing Source Summary..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/unified-health/$UserId/summary$dateParam" -Method Get
    Write-Host "✅ Source Summary: PASSED" -ForegroundColor Green
    Write-Host "   Interview Signals: $($response.sources.interviewSignals.available)" -ForegroundColor Gray
    Write-Host "   Wearables: $($response.sources.wearables.available)" -ForegroundColor Gray
    Write-Host "   Nutrition: $($response.sources.nutrition.available)" -ForegroundColor Gray
    Write-Host "   Workouts: $($response.sources.workouts.available)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Source Summary: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
