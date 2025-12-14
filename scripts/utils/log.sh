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

# Base logging function that all other log functions call
# Usage: log "LEVEL" "color" "message parts..."
log() {
  local level="$1"
  local color="$2"
  shift 2
  echo -e "${color}${level}${NC} $*"
}

# Logging functions matching application logger API
# Usage: log_info "message" or log_info "message" "with" "multiple" "parts"

# DEBUG: Detailed diagnostic information for troubleshooting
log_debug() {
  log "DEBUG" "$BLUE" "$@"
}

# INFO: General informational messages about script progress
log_info() {
  log "INFO" "$GREEN" "$@"
}

# WARN: Warning messages about potential issues that don't prevent execution
log_warn() {
  log "WARN" "$YELLOW" "$@"
}

# ERROR: Error messages indicating failures that may stop execution
log_error() {
  log "ERROR" "$RED" "$@"
}
