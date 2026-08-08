# This directory holds runtime secret files that are NEVER committed to git.
#
# Required files (create locally or mount via Docker / Kubernetes secrets):
#
#   secrets/google-credentials.json      — State Material Pipeline service account
#   secrets/google-qb-credentials.json   — Question Bank Pipeline service account
#
# These files are mounted read-only into the container at /run/secrets/.
# Obtain them from Google Cloud Console → IAM → Service Accounts → Keys.
# Store them securely in a secret manager (AWS Secrets Manager, GCP Secret Manager).

# Ignore everything in this directory EXCEPT this README
*
!.gitignore
!README.md
