# Contribution Guidelines

**Note:** If these contribution guidelines are not followed your issue or PR might be closed, so
please read these instructions carefully.

_See also: [the Invertase code of conduct](https://github.com/invertase/meta/blob/main/CODE_OF_CONDUCT.md)_

## About

React Query Firebase provides a set of easy to use hooks for handling asynchronous tasks with Firebase in your React application.


## Contribution types

### Bug Report

- If you find a bug, please first report it using [GitHub issues](https://github.com/invertase/react-query-firebase/issues/new?assignees=&labels=bug%2Ctriage&template=bug_report.yml).
  - First check if there is not already an issue for it; duplicated issues will be closed.

### Bug Fix

- If you'd like to submit a fix for a bug, please read the [How To](#how-to-contribute) for how to send a pull request.
- Indicate on the open issue that you are working on fixing the bug and the issue will be assigned to you.
- Include a test that isolates the bug and verifies that it was fixed.

### New Features

- If you'd like to add a feature to the library that doesn't already exist, feel free to describe the feature in a new [GitHub issue](https://github.com/invertase/react-query-firebase/issues/new?assignees=&labels=feature+request%2Ctriage&template=feature-request.md).
- If you'd like to implement the new feature, please wait for feedback from the project maintainers before spending too much time writing the code. In some cases, enhancements may not align well with the project future development direction.
- If applicable, implement the code for the new feature and please read the [How To](#how-to-contribute).

### Documentation & Miscellaneous

- If you have suggestions for improvements to the documentation or examples (or something else), we would love to hear about it.
- As always first file a [GitHub issue](https://github.com/invertase/react-query-firebase/issues/new?assignees=&labels=feature+request%2Ctriage&template=documentation-feedback.md).
- Implement the changes to the documentation, please read the [How To](#how-to-contribute).


## How To Contribute

### 1. Things you will need

- Linux, Mac OS X, or Windows.
- [git](https://git-scm.com) (used for source version control).
- An ssh client (used to authenticate with GitHub).
- An IDE such as [Visual Studio Code](https://code.visualstudio.com/). 

### 2. Forking & cloning the repository

- Ensure all the dependencies described in the previous section are installed.
- Fork `https://github.com/invertase/react-query-firebase` into your own GitHub account. If
  you already have a fork, and are now installing a development environment on
  a new machine, make sure you've updated your fork so that you don't use stale
  configuration options from long ago.
- `git clone git@github.com:<your_name_here>/react-query-firebase.git`
- `git remote add upstream git@github.com:invertase/react-query-firebase.git` (So that you
  fetch from the main repository, not your clone, when running `git fetch`
  et al.)
 
### 3. Performing changes

We gladly accept contributions via GitHub pull requests.

keep the code consistent and avoid common pitfalls.

To start working on a patch:

1. `git fetch upstream`
2. `git checkout upstream/main -b <name_of_your_branch>`
3. Hack away!

Once you have made your changes, ensure that it passes the testing & formatting checks. 

Assuming all is successful, commit and push your code:

1. `git commit -a -m "<your informative commit message>"`
2. `git push origin <name_of_your_branch>`

To send us a pull request:

- `git pull-request` (if you are using [Hub](http://github.com/github/hub/)) or
  go to `https://github.com/invertase/react-query-firebase` and click the
  "Compare & pull request" button

Please make sure all your check-ins have detailed commit messages explaining the patch.

When naming the title of your pull request, please follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/)
guide. 

Tests are run automatically on contributions using GitHub Actions. Depending on
your code contributions, various tests will be run against your updated code automatically.

Once you've gotten an LGTM from a project maintainer and once your PR has received
the green light from all our automated testing, wait for one the package maintainers
to merge the pull request.
 
### The review process

Newly opened PRs first go through initial triage which results in one of:

- **Merging the PR** - if the PR can be quickly reviewed and looks good.
- **Closing the PR** - if the PR maintainer decides that the PR should not be merged.
- **Moving the PR to the backlog** - if the review requires non trivial effort and the issue isn't a priority; in this case the maintainer will:
  - Add the `backlog` label to the issue.
  - Leave a comment on the PR explaining that the review is not trivial and that the issue will be looked at according to priority order.
- **Starting a non trivial review** - if the review requires non trivial effort and the issue is a priority; in this case the maintainer will:
  - Add the "in review" label to the issue.
  - Self assign the PR.
 