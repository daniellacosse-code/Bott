#!/usr/bin/env bash
# @license
# This file is part of Bott.
#
# This project is dual-licensed:
# - Non-commercial use: AGPLv3 (see LICENSE file for full text).
# - Commercial use: Proprietary License (contact D@nielLaCos.se for details).
#
# Copyright (C) 2025 DanielLaCos.se

# Logging utilities for Bott scripts
# Aligned with application logger levels (debug, info, warn, error)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions matching application logger API
# Usage: log_info "message" or log_info "message" "with" "multiple" "parts"

# DEBUG: Detailed diagnostic information for troubleshooting
log_debug() {
  echo -e "${BLUE}DEBUG${NC} $*"
}

# INFO: General informational messages about script progress
log_info() {
  echo -e "${GREEN}INFO${NC} $*"
}

# WARN: Warning messages about potential issues that don't prevent execution
log_warn() {
  echo -e "${YELLOW}WARN${NC} $*"
}

# ERROR: Error messages indicating failures that may stop execution
log_error() {
  echo -e "${RED}ERROR${NC} $*"
}
