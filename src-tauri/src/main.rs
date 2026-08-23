// Rust is used ONLY for OS integration, native dialogs, and security-critical
// native operations (see docs/ARCHITECTURE.md, AD-002). Domain/business logic
// must NOT be duplicated here — it lives in src/domain and src/application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ideatobuild_lib::run();
}
