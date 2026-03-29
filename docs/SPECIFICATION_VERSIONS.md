# Specification Versions

This document tracks product specification versions for the Health platform.

## Current Primary Specification

- **Version 13 (Primary)**
  - `docs/PRODUCT_SPEC_VERSION_13_PERSONAL_HEALTH_PERFORMANCE_AGENT.md`
  - Status: Active / canonical system specification
  - Date: March 28, 2026
  - Changes: Enhanced intelligence with dynamic follow-ups, structured save back, expanded biomarkers, context aggregation, and validation infrastructure

## Historical Specifications

- **Version 12**
  - `docs/PRODUCT_SPEC_VERSION_12_PERSONAL_HEALTH_PERFORMANCE_AGENT.md`
  - Status: Superseded by Version 13
  - Foundation: Document-driven architecture baseline

## Supporting and Historical Docs

- `docs/phase-1-completion.md`
- `docs/phase-2-control-tower-status.md`
- `docs/CHECKPOINT_BLOODWORK_UPLOAD_COMPLETE.md`
- `PRODUCT_SPEC_V12_STATUS_REPORT.md` - Implementation status vs V12

## Versioning Notes

- New major specs should be added as `PRODUCT_SPEC_VERSION_<N>_...md`.
- Keep only one spec marked **Primary** at a time.
- When promoting a new primary spec, update:
  - `README.md` primary spec pointer
  - this `docs/SPECIFICATION_VERSIONS.md` index
