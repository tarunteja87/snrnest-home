param(
  [string]$Profile = "snrnest",
  [string]$DomainName = "snrnest.in",
  [string]$StackName = "snrnest-static-site",
  [string]$GitHubOwner = "tarunteja87",
  [string]$GitHubRepo = "snrnest-home",
  [string]$GitHubOidcSubject = "repo:tarunteja87@101967683/snrnest-home@1358319442:ref:refs/heads/main",
  [string]$SiteBucketName = "snrnest-com-site"
)

$ErrorActionPreference = "Stop"
$Region = "us-east-1"
$TemplatePath = Join-Path $PSScriptRoot "..\infrastructure\static-site.yml"

function Invoke-Aws {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
  & aws @Arguments --profile $Profile
  if ($LASTEXITCODE -ne 0) {
    throw "AWS command failed: aws $($Arguments -join ' ') --profile $Profile"
  }
}

Write-Host "Checking AWS identity for profile '$Profile'..."
Invoke-Aws sts get-caller-identity | Out-Host

$zoneId = Invoke-Aws route53 list-hosted-zones-by-name --dns-name $DomainName --query "HostedZones[?Name=='$DomainName.'].Id | [0]" --output text

if (-not $zoneId -or $zoneId -eq "None") {
  Write-Host "Creating Route 53 hosted zone for $DomainName..."
  $callerReference = "snrnest-$([guid]::NewGuid().ToString())"
  $zoneId = Invoke-Aws route53 create-hosted-zone --name $DomainName --caller-reference $callerReference --query "HostedZone.Id" --output text
}

$zoneId = $zoneId -replace "/hostedzone/", ""
Write-Host "Hosted zone id: $zoneId"

$nameServers = Invoke-Aws route53 get-hosted-zone --id $zoneId --query "DelegationSet.NameServers[]" --output text
Write-Host ""
Write-Host "Set these nameservers at the registrar for ${DomainName}:"
$nameServers -split "\s+" | Where-Object { $_ } | ForEach-Object { Write-Host "  $_" }
Write-Host ""

try {
  $publicNs = (Resolve-DnsName $DomainName -Type NS -ErrorAction Stop).NameHost
} catch {
  $publicNs = @()
}

$expectedNs = @($nameServers -split "\s+" | Where-Object { $_ } | ForEach-Object { $_.TrimEnd(".").ToLowerInvariant() })
$actualNs = @($publicNs | ForEach-Object { $_.TrimEnd(".").ToLowerInvariant() })
$delegated = $expectedNs.Count -gt 0 -and (@($expectedNs | Where-Object { $actualNs -contains $_ }).Count -eq $expectedNs.Count)

if (-not $delegated) {
  Write-Host "DNS is not delegated to this Route 53 zone yet."
  Write-Host "Deploying a CloudFront HTTPS URL now. Re-run after updating nameservers to attach $DomainName."
  $enableCustomDomain = "false"
} else {
  $enableCustomDomain = "true"
}

Write-Host "Deploying CloudFormation stack..."
$oidcProviderArn = Invoke-Aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(Arn, 'token.actions.githubusercontent.com')].Arn | [0]" --output text
if (-not $oidcProviderArn -or $oidcProviderArn -eq "None") {
  $oidcProviderArn = ""
}

Invoke-Aws cloudformation deploy `
  --region $Region `
  --stack-name $StackName `
  --template-file $TemplatePath `
  --capabilities CAPABILITY_NAMED_IAM `
  --parameter-overrides `
    DomainName=$DomainName `
    HostedZoneId=$zoneId `
    GitHubOwner=$GitHubOwner `
    GitHubRepo=$GitHubRepo `
    GitHubOidcSubject=$GitHubOidcSubject `
    SiteBucketName=$SiteBucketName `
    ExistingGitHubOidcProviderArn=$oidcProviderArn `
    EnableCustomDomain=$enableCustomDomain | Out-Host

$roleArn = Invoke-Aws cloudformation describe-stacks --region $Region --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='GitHubDeployRoleArn'].OutputValue | [0]" --output text
$siteUrl = Invoke-Aws cloudformation describe-stacks --region $Region --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='SiteUrl'].OutputValue | [0]" --output text

Write-Host "Configuring GitHub repository variables..."
& gh variable set AWS_DEPLOY_ROLE_ARN --body $roleArn
if ($LASTEXITCODE -ne 0) { throw "Failed to set GitHub variable AWS_DEPLOY_ROLE_ARN" }
& gh variable set AWS_STACK_NAME --body $StackName
if ($LASTEXITCODE -ne 0) { throw "Failed to set GitHub variable AWS_STACK_NAME" }

Write-Host ""
Write-Host "Infrastructure is ready."
Write-Host "Site URL: $siteUrl"
Write-Host "Push to main or run the GitHub Actions workflow manually to deploy files."
