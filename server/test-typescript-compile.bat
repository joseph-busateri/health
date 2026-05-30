@echo off
echo ========================================
echo TypeScript Compilation Test
echo ========================================
echo.

echo Testing hybrid interview service compilation...
npx tsc --noEmit src/services/hybridInterviewService.ts
if %errorlevel% neq 0 (
    echo FAILED: hybridInterviewService.ts has errors
    exit /b 1
)
echo PASS: hybridInterviewService.ts

echo.
echo Testing hybrid interview controller compilation...
npx tsc --noEmit src/controllers/hybridInterviewController.ts
if %errorlevel% neq 0 (
    echo FAILED: hybridInterviewController.ts has errors
    exit /b 1
)
echo PASS: hybridInterviewController.ts

echo.
echo Testing interview context service compilation...
npx tsc --noEmit src/services/interviewContextService.ts
if %errorlevel% neq 0 (
    echo FAILED: interviewContextService.ts has errors
    exit /b 1
)
echo PASS: interviewContextService.ts

echo.
echo Testing routes compilation...
npx tsc --noEmit src/routes/hybridInterview.routes.ts
if %errorlevel% neq 0 (
    echo FAILED: hybridInterview.routes.ts has errors
    exit /b 1
)
echo PASS: hybridInterview.routes.ts

echo.
echo ========================================
echo All TypeScript files compiled successfully!
echo ========================================
