(async () => {
  // =========================================================
  // Imports
  // =========================================================
  const { execSync } = require("child_process");
  const fs = require("fs");
  const path = require("path");
  const log = console.log;
  const DATE = new Date();
  const YEAR = DATE.getFullYear();
  const MONTH = DATE.getMonth() + 1;
  const DAY = DATE.getDate();
  const MILLISECONDS = Math.floor(Date.now() / 1000);
  const ROOT_DIRNAME = path.join(process.cwd());
  const ROOT_PATH = path.join(ROOT_DIRNAME);
  const CONFIG_FILE_RAW = path.join(ROOT_PATH, ".bumper.json");
  const CONFIG_FILE = JSON.parse(fs.readFileSync(CONFIG_FILE_RAW, "utf-8"));
  const PATH_TO_PACKAGE = path.join(ROOT_DIRNAME, CONFIG_FILE.packagePath);
  const PACKAGE_JSON_FILE = fs.readFileSync(path.join(PATH_TO_PACKAGE, "package.json"), "utf-8");
  const PACKAGE_JSON = JSON.parse(PACKAGE_JSON_FILE);
  const PACKAGE_JSON_ORIGINAL_EXPORTS = PACKAGE_JSON?.exports;
  // CI - GitHub Metadata
  const PR_NUMBER = process.env.PR_NUMBER || CONFIG_FILE.mock.PR_NUMBER || (() => { throw new Error("PR_NUMBER not found") })();
  const PR_COMMENT = process.env.PR_COMMENT || CONFIG_FILE.mock.PR_COMMENT || (() => { throw new Error("PR_COMMENT not found") })();

  try {
    if (!isABumperComment())
      return log("🤖 - [isABumperComment] Not a bumper comment, nothing to bump for now 😔");

    const gh = await GitHub();
    const BUMP_KIND = await gh.getBumpLabel();
    const PR_DESCRIPTION = await gh.getPRChangelogDescription(); // get from PR description
    // SOLVED
    const DEBUG = CONFIG_FILE.debug || false;
    const ACTION = PR_COMMENT.match(/bumper\/(beta|skip|release)/)?.[1] || (() => { throw new Error("Action not found") })();
    const COMMAND_BUILD = CONFIG_FILE.buildCommand || (() => { throw new Error("Build command not found") })();
    const MESSAGE = PR_DESCRIPTION || (() => { throw new Error("PR description not found") })();

    // =========================================================
    log(`[DEBUG:${DEBUG}]`);
    log(`[PackagePublisher] - Applying "${BUMP_KIND}" on "${PACKAGE_JSON.name}" from "${PACKAGE_JSON.version}"`);

    const actions = {
      "skip": async () => {
        log("action: skip");
        const commentID = await gh.addCommentToPR(`Skipping release...`);
        await mergePR()
          .then(async () => {
            await gh.updateCommentOnPR(commentID, `Release skipped successfully!`);
          })
          .catch(async (error) => {
            log("🤖 - [skip] Error merging PR:", error);
            await gh.updateCommentOnPR(commentID, `Error skipping release: ${error.message}`);
          });
      },
      "release": async () => {
        log("action: release");
        const isPRMergeable = await gh.isPRMergeable();
        const commentID = await gh.addCommentToPR(`Creating a release...`);
        // TODO: Check if we are able to merge the PR
        !isPRMergeable && await gh.updateCommentOnPR(commentID, `PR is not mergeable, please ensure that it's validated and try again.`);
        if (!isPRMergeable) return;

        runBuild();        // ✅
        updateVersion();   // ✅
        syncPackageJSON(); // ✅
        updateChangelog(); // ✅
        publishVersion();  // ✅
        resetPkgExports(); // ✅
        createGitCommit(); // ✅
        pushToPR();        // ✅
        createGitTag();    // ✅
        pushGitTag();      // ✅

        await mergePR()
          .then(async () => {
            await gh.updateCommentOnPR(commentID, (`
Release created successfully!
            
- **Package**: [\`${PACKAGE_JSON.name}\`](https://github.com/${await gh.getRepoOwner()}/${await gh.getRepoName()}/releases/tag/v${PACKAGE_JSON.version})
- **Version**:
\`\`\`sh
${PACKAGE_JSON.version}
\`\`\`
`
            ));
          })
          .catch(async (error) => {
            log("🤖 - [release] Error merging PR:", error);
            await gh.updateCommentOnPR(commentID, `Error creating release: ${error.message}`);
          });
      },
      "beta": async () => {
        log("action: beta");
        const commentID = await gh.addCommentToPR(`Creating a beta release...`);
        runBuild();        // ✅
        updateVersion();   // ✅
        syncPackageJSON(); // ✅
        updateChangelog(); // ✅
        createGitCommit(); // ✅
        createGitTag();    // ✅
        pushGitTag();      // ✅
        publishVersion();  // ✅
        resetBetaCommit(); // ✅
        discardChanges();  // ✅
        await gh.updateCommentOnPR(commentID, (`
Beta release created successfully!
      
- **Package**: [\`${PACKAGE_JSON.name}\`](https://github.com/${await gh.getRepoOwner()}/${await gh.getRepoName()}/releases/tag/v${PACKAGE_JSON.version})
- **Version**:
\`\`\`sh
${PACKAGE_JSON.version}
\`\`\`
`
        ));
      },
    }

    await actions[ACTION]();

    // =========================================================
    // Functions
    // =========================================================
    function runBuild() {
      log("🤖 - [runBuild] Running build command");
      DEBUG && log(COMMAND_BUILD);
      !DEBUG && execSync(COMMAND_BUILD, { stdio: "inherit" });
    }

    function pushToPR() {
      log("🤖 - [pushToPR] Pushing to PR");
      const gitCommand = `git push origin ${process.env.BRANCH_NAME}`;

      DEBUG && log(gitCommand);
      !DEBUG && execSync(gitCommand, { stdio: "inherit" });
    }

    function publishVersion() {
      log("🤖 - [publishVersion] Publishing version");
      const isBetaVersion = PACKAGE_JSON.version.includes("beta");

      const command = isBetaVersion
        ? `npm publish ${PATH_TO_PACKAGE} --tag beta --access public`
        : `npm publish ${PATH_TO_PACKAGE} --access public`;

      DEBUG && log(command);
      !DEBUG && execSync(command, { stdio: "inherit" });
    }

    function resetPkgExports() {
      log("🤖 - [resetPkgExports] Resetting package.json exports");
      if (PACKAGE_JSON_ORIGINAL_EXPORTS) {
        PACKAGE_JSON.exports = PACKAGE_JSON_ORIGINAL_EXPORTS;
        !DEBUG &&
          fs.writeFileSync(path.join(PATH_TO_PACKAGE, "package.json"), JSON.stringify(PACKAGE_JSON, null, 2));
      }
    }

    async function mergePR() {
      log("🤖 - Merging the PR");
    
      const maxAttempts = 5;
      const baseDelayMs = 30 * 1000; // 30 seconds in ms
    
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const data = await gh.mergePR();
          console.log("mergePR", data);
    
          if (data?.status?.startsWith("4") || data?.status?.startsWith("5")) {
            throw new Error(data.message);
          }
    
          // If successful, just return the data
          return data;
        } catch (error) {
          if (attempt === maxAttempts) {
            // Rethrow if we've tried 5 times already
            throw new Error(
              `Failed to merge PR after ${maxAttempts} attempts: ${error.message}`
            );
          }
    
          // Calculate the current delay
          const delayMs = baseDelayMs * attempt;
          log(`🤖 - Attempt ${attempt} failed. Retrying in ${delayMs / 1000}s...`);
    
          // Wait for the specified delay before reattempting
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    

    function resetBetaCommit() {
      log("🤖 - Resetting the beta commit");
      const gitCommand = `git reset HEAD~1`;

      DEBUG && log(gitCommand);
      !DEBUG && execSync(gitCommand, { stdio: "inherit" });
    }

    function discardChanges() {
      log("🤖 - Discarding changes");
      const gitCommand = `git checkout . && git clean -fd`;
      DEBUG && log(gitCommand);
      !DEBUG && execSync(gitCommand, { stdio: "inherit" });
    }

    function updateChangelog() {
      log("🤖 - [updateChangelog] Updating the changelog");
      const CHANGELOG_FILE_PATH = path.join(PATH_TO_PACKAGE, "CHANGELOG.md");
      const CHANGELOG_ROOT_FILE_PATH = path.join(ROOT_PATH, "CHANGELOG.md");
      const hasChangelogFile = fs.existsSync(CHANGELOG_FILE_PATH);
      const CHANGELOG_FILE = hasChangelogFile ? fs.readFileSync(CHANGELOG_FILE_PATH, "utf-8") : "";
      const parsedMessage = parseMessage(MESSAGE);

      const CHANGELOG_FILE_LINES = CHANGELOG_FILE.split("\n");
      CHANGELOG_FILE_LINES.unshift(`${parsedMessage}\n\n`);
      CHANGELOG_FILE_LINES.unshift(`# ${PACKAGE_JSON.version} - ${YEAR}-${MONTH}-${DAY}\n`);

      const UPDATED_CHANGELOG_FILE = CHANGELOG_FILE_LINES.join("\n");
      DEBUG && log(UPDATED_CHANGELOG_FILE);
      DEBUG &&
        log(`Saved on ${CHANGELOG_FILE_PATH}!`);
      !DEBUG &&
        fs.writeFileSync(CHANGELOG_FILE_PATH, UPDATED_CHANGELOG_FILE);
      DEBUG &&
        log(`Saved on ${CHANGELOG_ROOT_FILE_PATH}!`);
      !DEBUG &&
        fs.writeFileSync(CHANGELOG_ROOT_FILE_PATH, UPDATED_CHANGELOG_FILE);
    }
    function createGitTag() {
      log("🤖 - Create git TAG");
      const parsedMessage = parseMessage(MESSAGE);
      const gitCommand = `git tag -a v${PACKAGE_JSON.version} -m "Creating tag for the release: ${PACKAGE_JSON.version}"`;

      DEBUG &&
        log(gitCommand);
      !DEBUG &&
        execSync(gitCommand, { stdio: "inherit" });
    }

    function pushGitTag() {
      log("🤖 - Push git TAG");
      const gitCommand = `git push origin v${PACKAGE_JSON.version} --force`;

      DEBUG &&
        log(gitCommand);
      !DEBUG &&
        execSync(gitCommand, { stdio: "inherit" });
    }

    function createGitCommit() {
      log("🤖 - Create git commit");

      const gitStatusCommand = `git status --porcelain`;
      const hasChanges = execSync(gitStatusCommand).toString().trim().length > 0;

      if (!hasChanges) {
        log("🤖 - No changes to commit");
        return;
      }

      const gitCommand = `git add . && git commit -m "Committing ${PACKAGE_JSON.version} - ${YEAR}-${MONTH}-${DAY}"`;

      DEBUG &&
        log(gitCommand);
      !DEBUG &&
        execSync(gitCommand, { stdio: "inherit" });
    }

    function updateVersion() {
      log("🤖 - [updateVersion] Updating the version");
      const isVersionAlreadyBeta = PACKAGE_JSON.version.includes("beta");
      let newVersion;
      const CURRENT_VERSION = normalizeVersion(PACKAGE_JSON.version).split(".");

      const major = isVersionAlreadyBeta && BUMP_KIND === "major" ? CURRENT_VERSION[0] - 1 : CURRENT_VERSION[0];
      const minor = isVersionAlreadyBeta && BUMP_KIND === "minor" ? CURRENT_VERSION[1] - 1 : CURRENT_VERSION[1];
      const patch = isVersionAlreadyBeta && BUMP_KIND === "patch" ? CURRENT_VERSION[2] - 1 : CURRENT_VERSION[2];

      log(`Version: ${PACKAGE_JSON.version} -> ${major}.${minor}.${patch} [base version]`);

      switch (BUMP_KIND) {
        case "major":
          newVersion = `${parseInt(major) + 1}.0.0`;
          break;
        case "minor":
          newVersion = `${major}.${parseInt(minor) + 1}.0`;
          break;
        case "patch":
          newVersion = `${major}.${minor}.${parseInt(patch) + 1}`;
          break;
        default:
          throw new Error("Invalid bump kind");
      }

      if (ACTION === "beta") {
        newVersion = `${newVersion}-beta${YEAR}${MONTH}${DAY}${MILLISECONDS}PR${PR_NUMBER}`;
      }

      log(`Applying ${newVersion} from ${PACKAGE_JSON.version} through a ${BUMP_KIND}`)
      PACKAGE_JSON.version = newVersion;
    }

    function syncPackageJSON() {
      log("🤖 - [syncPackageJSON] Syncing package.json...");
      const PACKAGE_JSON_POST_BUILD = fs.readFileSync(path.join(PATH_TO_PACKAGE, "package.json"), "utf-8");
      const PACKAGE_JSON_POST_BUILD_PARSED = JSON.parse(PACKAGE_JSON_POST_BUILD);

      const pkgExports = PACKAGE_JSON_POST_BUILD_PARSED?.exports;

      if (pkgExports) PACKAGE_JSON.exports = pkgExports;

      !DEBUG &&
        fs.writeFileSync(path.join(PATH_TO_PACKAGE, "package.json"), JSON.stringify(PACKAGE_JSON, null, 2));
    }

    function parseMessage() {
      const lines = MESSAGE.split("\n");
      const filteredLines = lines.filter(line => line.trim() !== "");
      const parsedMessage = filteredLines
        .map(line => line.replace("## Changelog", "").trim())
        .filter(Boolean)
        .join("\n");
      return parsedMessage;
    }
    function normalizeVersion(version) {
      const versionParts = version.split(".");
      return `${versionParts[0]}.${versionParts[1]}.${versionParts[2].split("-")[0]}`;
    }

    function isABumperComment() {
      const isBumperComment = PR_COMMENT
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "")
        .join("")
        .startsWith("bumper/");

      return isBumperComment;
    }
  } catch (error) {
    console.error("🤖 - [error] Error:", error);
    const gh = await GitHub();
    await gh.addCommentToPR(`Error: ${error.message}`);
    process.exit(1);
  }

  async function GitHub() {
    console.log("PACKAGE_JSON.repository", PACKAGE_JSON.repository);
    const [owner, repo] = new URL(PACKAGE_JSON.repository).pathname.split("/").filter(Boolean);
    console.log("owner.repo", { owner, repo });
    const BASE_URL = `https://api.github.com/repos/${owner}/${repo}/issues/${PR_NUMBER}`;
    const prInfo = await fetch(BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
      },
    })
      .then(res => res.json());

    console.log("[prInfo]", prInfo);

    return {
      async getRepoOwner() {
        return owner;
      },
      async getRepoName() {
        return repo;
      },
      async isPRMergeable() {
        const BASE_URL = `https://api.github.com/repos/${owner}/${repo}/pulls/${PR_NUMBER}`;
        const response = await fetch(BASE_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GH_TOKEN}`,
          },
        });

        const data = await response.json();
        return data.mergeable && data.mergeable_state === "clean";
      },
      async mergePR() {
        const BASE_URL = `https://api.github.com/repos/${owner}/${repo}/pulls/${PR_NUMBER}/merge`;
        const response = await fetch(BASE_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GH_TOKEN}`,
          },
          body: JSON.stringify({ commit_title: `Merge PR #${PR_NUMBER}` }),
        });

        const data = await response.json();
        return data;
      },
      async addCommentToPR(comment) {
        const BASE_URL = `https://api.github.com/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`;
        const response = await fetch(BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GH_TOKEN}`,
          },
          body: JSON.stringify({ body: comment }),
        });

        const data = await response.json();
        return data.id;
      },
      async updateCommentOnPR(commentId, newComment) {
        const BASE_URL = `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`;
        const response = await fetch(BASE_URL, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GH_TOKEN}`,
          },
          body: JSON.stringify({ body: newComment }),
        });

        const data = await response.json();
        return data.id;
      },
      async getPRChangelogDescription() {
        const changelogDescription = prInfo.body.split("## Changelog")[1];
        return `## Changelog\n${changelogDescription}`;
      },
      async getBumpLabel() {
        const validBumpLabels = [
          "major",
          "minor",
          "patch",
        ];

        // Check if PR has labels
        if (prInfo.labels.length === 0) {
          await this.addCommentToPR("No labels found, please add one of `major`,`minor` or `patch` labels");
          throw new Error("No labels found");
        }
        // Check if PR has valid labels
        const labels = prInfo.labels.map(label => label.name);
        const hasValidLabel = labels.some(label => validBumpLabels.includes(label));
        if (!hasValidLabel) {
          throw new Error("No valid labels found");
        }
        // Check if PR has multiple valid labels, if so, throw an error
        const validLabels = labels.filter(label => validBumpLabels.includes(label));
        if (validLabels.length > 1) {
          throw new Error("Multiple valid labels found, please choose one");
        }

        const prBumpLabel = labels.find(label => validBumpLabels.includes(label));

        return prBumpLabel;
      },
    };
  };
  // =========================================================
})();
