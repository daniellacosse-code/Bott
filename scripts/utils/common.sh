#!/usr/bin/env bash
# @license
# This file is part of Bott.
#
# This project is dual-licensed:
# - Non-commercial use: AGPLv3 (see LICENSE file for full text).
# - Commercial use: Proprietary License (contact D@nielLaCos.se for details).
#
# Copyright (C) 2025 DanielLaCos.se

# Common utilities for Bott scripts

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
check_gcloud() {
  if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
    exit 1
  fi
}
