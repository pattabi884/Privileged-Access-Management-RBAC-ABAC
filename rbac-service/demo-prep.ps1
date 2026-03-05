# ============================================================
# PAM Demo Prep + Smoke Test
# Run from project root: .\demo-prep.ps1
# ============================================================

$BASE = "http://localhost:3010/api"
$pass = 0
$fail = 0

function Check($label, $condition) {
  if ($condition) {
    Write-Host "  [PASS] $label" -ForegroundColor Green
    $global:pass++
  } else {
    Write-Host "  [FAIL] $label" -ForegroundColor Red
    $global:fail++
  }
}

function TryPost($url, $body, $token = $null) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  try { return Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body ($body | ConvertTo-Json) }
  catch { return $null }
}

function TryGet($url, $token = $null) {
  $headers = @{}
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  try { return Invoke-RestMethod -Uri $url -Method GET -Headers $headers }
  catch { return $null }
}

function TryPatch($url, $body, $token) {
  $headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" }
  try { return Invoke-RestMethod -Uri $url -Method PATCH -Headers $headers -Body ($body | ConvertTo-Json) }
  catch { return $null }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PAM DEMO PREP + SMOKE TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Seed demo users
Write-Host "[ 1 ] Seeding demo users..." -ForegroundColor Yellow

$demoUsers = @(
  @{ email="alice.manager@sentry.dev";  password="Manager@1234";  name="Alice Chen";   department="engineering" },
  @{ email="bob.analyst@sentry.dev";    password="Analyst@1234";  name="Bob Okafor";   department="security" },
  @{ email="carol.employee@sentry.dev"; password="Employee@1234"; name="Carol Singh";  department="finance" },
  @{ email="dave.employee@sentry.dev";  password="Employee@1234"; name="Dave Torres";  department="engineering" },
  @{ email="eve.employee@sentry.dev";   password="Employee@1234"; name="Eve Nakamura"; department="hr" }
)

foreach ($u in $demoUsers) {
  $res = TryPost "$BASE/auth/register" $u
  if ($res) {
    Write-Host "  + Created: $($u.email)" -ForegroundColor Gray
  } else {
    Write-Host "  ~ Exists:  $($u.email)" -ForegroundColor DarkGray
  }
}

# 2. Login
Write-Host ""
Write-Host "[ 2 ] Authenticating..." -ForegroundColor Yellow

$adminLogin = TryPost "$BASE/auth/login" @{ email="admin@sentry.dev"; password="Admin@1234" }
$adminToken = $adminLogin.access_token
Check "Admin login" ($adminToken -ne $null -and $adminToken -ne "")

$aliceLogin = TryPost "$BASE/auth/login" @{ email="alice.manager@sentry.dev"; password="Manager@1234" }
$aliceToken = $aliceLogin.access_token
Check "Alice (manager) login" ($aliceToken -ne $null)

$bobLogin = TryPost "$BASE/auth/login" @{ email="bob.analyst@sentry.dev"; password="Analyst@1234" }
$bobToken = $bobLogin.access_token
Check "Bob (analyst) login" ($bobToken -ne $null)

$carolLogin = TryPost "$BASE/auth/login" @{ email="carol.employee@sentry.dev"; password="Employee@1234" }
$carolToken = $carolLogin.access_token
Check "Carol (employee) login" ($carolToken -ne $null)

# 3. Fetch users
Write-Host ""
Write-Host "[ 3 ] Fetching users..." -ForegroundColor Yellow

$users = TryGet "$BASE/users" $adminToken
Check "Admin can list users" ($users -ne $null -and $users.Count -gt 0)

$aliceId = ($users | Where-Object { $_.email -eq "alice.manager@sentry.dev" })._id
$bobId   = ($users | Where-Object { $_.email -eq "bob.analyst@sentry.dev" })._id
$carolId = ($users | Where-Object { $_.email -eq "carol.employee@sentry.dev" })._id
$daveId  = ($users | Where-Object { $_.email -eq "dave.employee@sentry.dev" })._id

Check "Found Alice" ($aliceId -ne $null)
Check "Found Bob"   ($bobId -ne $null)
Check "Found Carol" ($carolId -ne $null)
Check "Found Dave"  ($daveId -ne $null)

# 4. Assign roles
Write-Host ""
Write-Host "[ 4 ] Assigning roles..." -ForegroundColor Yellow

$roles = TryGet "$BASE/roles" $adminToken
Check "Fetched roles" ($roles -ne $null -and $roles.Count -gt 0)

$managerRoleId  = ($roles | Where-Object { $_.name -eq "manager" })._id
$analystRoleId  = ($roles | Where-Object { $_.name -eq "security_analyst" })._id
$employeeRoleId = ($roles | Where-Object { $_.name -eq "employee" })._id

TryPost "$BASE/user-roles/assign" @{ userId=$aliceId; roleId=$managerRoleId;  assignedBy="admin@sentry.dev" } $adminToken | Out-Null
TryPost "$BASE/user-roles/assign" @{ userId=$bobId;   roleId=$analystRoleId;  assignedBy="admin@sentry.dev" } $adminToken | Out-Null
TryPost "$BASE/user-roles/assign" @{ userId=$carolId; roleId=$employeeRoleId; assignedBy="admin@sentry.dev" } $adminToken | Out-Null
TryPost "$BASE/user-roles/assign" @{ userId=$daveId;  roleId=$employeeRoleId; assignedBy="admin@sentry.dev" } $adminToken | Out-Null

$aliceRoles = TryGet "$BASE/user-roles/user/$aliceId/roles" $adminToken
$bobRoles   = TryGet "$BASE/user-roles/user/$bobId/roles" $adminToken
$carolRoles = TryGet "$BASE/user-roles/user/$carolId/roles" $adminToken

Check "Alice has manager role"  (($aliceRoles | Where-Object { $_.name -eq "manager" }) -ne $null)
Check "Bob has analyst role"    (($bobRoles   | Where-Object { $_.name -eq "security_analyst" }) -ne $null)
Check "Carol has employee role" (($carolRoles | Where-Object { $_.name -eq "employee" }) -ne $null)

# 5. Create access requests
Write-Host ""
Write-Host "[ 5 ] Creating access requests..." -ForegroundColor Yellow

$req1 = TryPost "$BASE/access-requests" @{
  resource="production-database"
  justification="Need access to investigate performance issue in prod"
  requestedDuration="1 day"
} $carolToken

$req2 = TryPost "$BASE/access-requests" @{
  resource="analytics-export"
  justification="Quarterly finance report requires export access"
  requestedDuration="permanent"
} $carolToken

$req3 = TryPost "$BASE/access-requests" @{
  resource="kubernetes-cluster"
  justification="Deploying hotfix to production, urgent"
  requestedDuration="2 hours"
} $aliceToken

$req4 = TryPost "$BASE/access-requests" @{
  resource="employee-records"
  justification="HR audit requires read access to personnel files"
  requestedDuration="1 week"
} $bobToken

Check "Carol requested production-database" ($req1 -ne $null)
Check "Carol requested analytics-export"    ($req2 -ne $null)
Check "Alice requested kubernetes-cluster"  ($req3 -ne $null)
Check "Bob requested employee-records"      ($req4 -ne $null)

# 6. Approve and reject
Write-Host ""
Write-Host "[ 6 ] Reviewing requests..." -ForegroundColor Yellow

if ($req1) {
  $approved = TryPatch "$BASE/access-requests/$($req1._id)/approve" @{ reviewNote="Approved for incident investigation" } $adminToken
  Check "Admin approved production-database" ($approved -ne $null)
}

if ($req2) {
  $rejected = TryPatch "$BASE/access-requests/$($req2._id)/reject" @{ reviewNote="Permanent access not permitted, request temp access instead" } $adminToken
  Check "Admin rejected analytics-export" ($rejected -ne $null)
}

# 7. RBAC enforcement
Write-Host ""
Write-Host "[ 7 ] RBAC enforcement checks..." -ForegroundColor Yellow

Check "Employee CANNOT list users"     ((TryGet "$BASE/users" $carolToken) -eq $null)
Check "Employee CANNOT list roles"     ((TryGet "$BASE/roles" $carolToken) -eq $null)
Check "Manager CAN list users"         ((TryGet "$BASE/users" $aliceToken) -ne $null)
Check "Analyst CAN list users"         ((TryGet "$BASE/users" $bobToken) -ne $null)
Check "Employee CAN view own requests" ((TryGet "$BASE/access-requests/mine" $carolToken) -ne $null)
Check "Admin CAN view all requests"    ((TryGet "$BASE/access-requests" $adminToken) -ne $null)

# 8. Audit
Write-Host ""
Write-Host "[ 8 ] Audit log..." -ForegroundColor Yellow

$auditLogs = TryGet "$BASE/audit/suspicious" $adminToken
Check "Audit endpoint responds" ($auditLogs -ne $null)

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
$total = $pass + $fail
if ($fail -eq 0) {
  Write-Host "  ALL $total TESTS PASSED - READY TO RECORD" -ForegroundColor Green
} else {
  Write-Host "  $pass of $total passed, $fail FAILED" -ForegroundColor Yellow
  Write-Host "  Fix failures before recording" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo accounts:" -ForegroundColor Cyan
Write-Host "  Admin:    admin@sentry.dev          / Admin@1234"
Write-Host "  Manager:  alice.manager@sentry.dev  / Manager@1234"
Write-Host "  Analyst:  bob.analyst@sentry.dev    / Analyst@1234"
Write-Host "  Employee: carol.employee@sentry.dev / Employee@1234"
Write-Host "  Employee: dave.employee@sentry.dev  / Employee@1234"
Write-Host ""