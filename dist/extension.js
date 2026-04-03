// src/extension.ts
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

// src/core/logging/ConsoleLogger.ts
var ConsoleLogger = class {
  prefix = "[SymfonyMenubar]";
  debug(message, ...args) {
    console.debug(`${this.prefix} ${message}`, ...args);
  }
  info(message, ...args) {
    console.info(`${this.prefix} ${message}`, ...args);
  }
  warn(message, ...args) {
    console.warn(`${this.prefix} ${message}`, ...args);
  }
  error(message, ...args) {
    console.error(`${this.prefix} ${message}`, ...args);
  }
};

// src/core/GjsProcessRunner.ts
import Gio from "gi://Gio";
var GjsProcessRunner = class {
  /**
   * @param logger The logger to record command execution and results.
   * @param binaryPath Default binary to run (e.g., 'symfony'). Defaults to 'symfony'.
   */
  constructor(logger, binaryPath = "symfony") {
    this.logger = logger;
    this.binaryPath = binaryPath;
  }
  logger;
  binaryPath;
  /**
   * Executes a command with arguments asynchronously and returns the stdout.
   * 
   * @param command Array containing the arguments (e.g., ['ls', '-la'] or just ['-la'] if binary is set).
   * @returns A promise that resolves to the stdout string on success.
   * @throws Error if the process fails or returns a non-zero exit code.
   */
  async run(command) {
    let binary = this.binaryPath;
    let args = command;
    if (command.length > 0 && command[0].startsWith("/")) {
      binary = command[0];
      args = command.slice(1);
    }
    const fullArgs = [binary, ...args];
    const commandLine = fullArgs.join(" ");
    this.logger.info(`Running command: ${commandLine}`);
    return new Promise((resolve, reject) => {
      let proc;
      try {
        proc = Gio.Subprocess.new(
          fullArgs,
          Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        );
      } catch (error) {
        const errorMessage = `Failed to create subprocess for command: ${commandLine}. Error: ${error}`;
        this.logger.error(errorMessage);
        return reject(new Error(errorMessage));
      }
      proc.communicate_utf8_async(null, null, (subprocess, result) => {
        try {
          const [stdout, stderr] = subprocess.communicate_utf8_finish(result);
          const status = subprocess.get_exit_status();
          const exited = subprocess.get_if_exited();
          if (!exited || status !== 0) {
            const errorMessage = `Command '${commandLine}' exited with status ${status}. Stderr: ${stderr || "no error output"}`;
            this.logger.error(errorMessage);
            return reject(new Error(errorMessage));
          }
          this.logger.debug(`Command '${commandLine}' executed successfully.`);
          resolve(stdout || "");
        } catch (error) {
          const errorMessage = `Error reading output of command: ${commandLine}. Error: ${error}`;
          this.logger.error(errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });
  }
};

// src/core/commands/VersionCommand.ts
var VersionCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "version";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    this.logger?.info(`Executing command ${commandName}`);
    try {
      const commandArgs = ["version", "--no-ansi", ...args];
      const output = await this.processRunner.run(commandArgs);
      if (!output || output.trim() === "") {
        this.logger?.warn(`Empty output from ${commandName}`);
      }
      const match = output.match(/Symfony CLI (?:version|v)?\s*(\d+\.\d+\.\d+)/i);
      if (match) {
        return { version: match[1] };
      }
      this.logger?.warn(`Could not parse version from output: ${output}`);
      return { version: output.trim() };
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      throw error;
    }
  }
};

// src/core/commands/ServerListCommand.ts
var ServerListCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "server:list";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    this.logger?.info(`Executing command ${commandName}`);
    try {
      const commandArgs = ["server:list", "--no-ansi", ...args];
      const output = await this.processRunner.run(commandArgs);
      if (!output || output.trim() === "") {
        this.logger?.warn(`No servers found (empty output) for ${commandName}`);
      }
      const servers = [];
      const lines = output.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.includes("Directory") || !trimmed.includes("|")) {
          continue;
        }
        const columns = trimmed.split("|").map((c) => c.trim()).filter((c) => c !== "");
        if (columns.length < 2) continue;
        const directory = columns[0];
        const portStr = columns[1];
        let port = 8e3;
        let isRunning = false;
        if (portStr.toLowerCase() === "not running") {
          isRunning = false;
        } else {
          const p = parseInt(portStr, 10);
          if (!isNaN(p)) {
            port = p;
            isRunning = true;
          }
        }
        const url = isRunning ? `https://127.0.0.1:${port}` : "";
        servers.push({
          directory,
          port,
          url,
          isRunning
        });
      }
      if (servers.length === 0 && output.trim() !== "") {
        this.logger?.warn(`No servers found in output of ${commandName}`);
      }
      return servers;
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      throw error;
    }
  }
};

// src/core/commands/PhpListCommand.ts
var PhpListCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "local:php:list";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    this.logger?.info(`Executing command ${commandName}`);
    try {
      const commandArgs = ["local:php:list", "--no-ansi", ...args];
      const output = await this.processRunner.run(commandArgs);
      if (!output || output.trim() === "") {
        this.logger?.warn(`No PHP versions found (empty output) for ${commandName}`);
      }
      const versions = [];
      const lines = output.split("\n");
      const versionRegex = /(\d+\.\d+(?:\.\d+)?)/;
      const pathRegex = /(\/[^\s│|]+)/;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("\u2500") || trimmed.startsWith("\u250C") || trimmed.startsWith("\u2514") || trimmed.startsWith("\u251C") || trimmed.includes("Version")) {
          continue;
        }
        const versionMatch = trimmed.match(versionRegex);
        if (!versionMatch) continue;
        const version = versionMatch[1];
        const isDefault = trimmed.toLowerCase().includes("default") || trimmed.includes("*") || trimmed.includes("\u2B50");
        const pathMatch = trimmed.match(pathRegex);
        const path = pathMatch ? pathMatch[1] : "";
        if (!versions.find((v) => v.version === version)) {
          versions.push({
            version,
            path,
            isDefault
          });
        }
      }
      if (versions.length === 0 && output.trim() !== "") {
        this.logger?.warn(`No PHP versions found in output of ${commandName}`);
      }
      return versions;
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      throw error;
    }
  }
};

// src/core/commands/ProxyStatusCommand.ts
var ProxyStatusCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "proxy:status";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    this.logger?.info(`Executing command ${commandName}`);
    try {
      const commandArgs = ["proxy:status", "--no-ansi", ...args];
      const output = await this.processRunner.run(commandArgs);
      if (!output || output.trim() === "") {
        this.logger?.warn(`Empty output from ${commandName}`);
      }
      const lines = output.split("\n");
      let isRunning = false;
      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i].toLowerCase();
        if (line.includes("listening") || line.includes("proxy is running")) {
          isRunning = true;
          break;
        }
      }
      const proxies = [];
      const domainRegex = /([a-zA-Z0-9.\-]+\.wip)/;
      const pathRegex = /([~/][^\s|│]+)/;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.startsWith("\u250C") || trimmed.startsWith("\u2514") || trimmed.startsWith("\u251C") || trimmed.includes("Domain") || trimmed.includes("Directory")) {
          continue;
        }
        const domainMatch = trimmed.match(domainRegex);
        if (domainMatch) {
          const domain = domainMatch[1];
          const pathMatch = trimmed.match(pathRegex);
          const directory = pathMatch ? pathMatch[1] : "";
          if (!proxies.find((p) => p.domain === domain)) {
            proxies.push({ domain, directory });
          }
        }
      }
      return { isRunning, proxies };
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      throw error;
    }
  }
};

// src/core/commands/ServerStartCommand.ts
var ServerStartCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "server:start";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    this.logger?.info(`Executing command ${commandName}`);
    try {
      const commandArgs = ["server:start", "-d", ...args];
      const output = await this.processRunner.run(commandArgs);
      const lowerOutput = output.toLowerCase();
      const success = lowerOutput.includes("listening") || lowerOutput.includes("already running");
      if (!success) {
        this.logger?.warn(`Command ${commandName} did not indicate clear success. Output: ${output}`);
      }
      return success;
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      throw error;
    }
  }
};

// src/core/commands/ServerStopCommand.ts
var ServerStopCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "server:stop";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    this.logger?.info(`Executing command ${commandName}`);
    try {
      const commandArgs = ["server:stop", ...args];
      const output = await this.processRunner.run(commandArgs);
      const lowerOutput = output.toLowerCase();
      const success = lowerOutput.includes("stopped") || lowerOutput.includes("no web server is running");
      if (!success) {
        this.logger?.warn(`Command ${commandName} did not indicate clear success. Output: ${output}`);
      }
      return success;
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      throw error;
    }
  }
};

// src/core/commands/ProxyStartCommand.ts
var ProxyStartCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "proxy:start";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    this.logger?.info(`Executing command ${commandName}`);
    try {
      const commandArgs = ["proxy:start", "--no-ansi", ...args];
      const output = await this.processRunner.run(commandArgs);
      const lowerOutput = output.toLowerCase();
      const success = lowerOutput.includes("listening") || lowerOutput.includes("already running");
      if (!success) {
        this.logger?.warn(`Command ${commandName} did not indicate clear success. Output: ${output}`);
      }
      return success;
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      throw error;
    }
  }
};

// src/core/commands/ProxyStopCommand.ts
var ProxyStopCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "proxy:stop";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    this.logger?.info(`Executing command ${commandName}`);
    try {
      const commandArgs = ["proxy:stop", "--no-ansi", ...args];
      const output = await this.processRunner.run(commandArgs);
      const lowerOutput = output.toLowerCase();
      const success = lowerOutput.includes("stopped") || lowerOutput.includes("not running");
      if (!success) {
        this.logger?.warn(`Command ${commandName} did not indicate clear success. Output: ${output}`);
      }
      return success;
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      throw error;
    }
  }
};

// src/core/commands/ProxyDomainDetachCommand.ts
var ProxyDomainDetachCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "proxy:domain:detach";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    this.logger?.info(`Executing command ${commandName}`);
    try {
      const commandArgs = ["proxy:domain:detach", "--no-ansi", ...args];
      const output = await this.processRunner.run(commandArgs);
      const lowerOutput = output.toLowerCase();
      const success = lowerOutput.includes("detached") || lowerOutput.includes("not defined anymore");
      if (!success) {
        this.logger?.warn(`Command ${commandName} did not indicate clear success. Output: ${output}`);
      }
      return success;
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      throw error;
    }
  }
};

// src/core/commands/WhichSymfonyCommand.ts
var WhichSymfonyCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "which";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    this.logger?.info(`Executing command ${commandName}`);
    try {
      const output = await this.processRunner.run(["/usr/bin/which", "symfony"]);
      const path = output.trim();
      if (!path) {
        this.logger?.warn(`Command ${commandName} returned empty path`);
      }
      return { path };
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      return { path: null };
    }
  }
};

// src/core/commands/PhpInfoCommand.ts
var PhpInfoCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "php:info";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    const commandName = this.getName();
    const runArgsIni = args.length > 0 ? [args[0], "--ini"] : ["--ini"];
    const runArgsM = args.length > 0 ? [args[0], "-m"] : ["-m"];
    const phpLabel = args.length > 0 ? ` for PHP: ${args[0]}` : "";
    this.logger?.info(`Executing command ${commandName}${phpLabel}`);
    try {
      const iniOutput = await this.processRunner.run(runArgsIni);
      const modulesOutput = await this.processRunner.run(runArgsM);
      const phpIniPath = this.parseIniPath(iniOutput);
      const modules = modulesOutput.toLowerCase();
      return {
        phpIniPath,
        hasXdebug: modules.includes("xdebug"),
        hasApcu: modules.includes("apcu"),
        hasOpcache: modules.includes("opcache")
      };
    } catch (error) {
      this.logger?.error(`Command ${commandName} failed`, error);
      throw error;
    }
  }
  parseIniPath(output) {
    const loadedMatch = output.match(/Loaded Configuration File:\s+(.+)/);
    if (loadedMatch && loadedMatch[1].trim() !== "(none)") {
      return loadedMatch[1].trim();
    }
    const pathMatch = output.match(/Configuration File \(php\.ini\) Path:\s+(.+)/);
    if (pathMatch) {
      return pathMatch[1].trim();
    }
    return "";
  }
};

// src/core/commands/OpenLogCommand.ts
var OpenLogCommand = class {
  constructor(processRunner) {
    this.processRunner = processRunner;
  }
  processRunner;
  logger;
  getName() {
    return "open:log";
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async execute(args = []) {
    try {
      if (!args || args.length === 0) {
        throw new Error("Project directory is required");
      }
      const projectPath = args[0];
      this.logger?.info(`Preparing log command for project: ${projectPath}`);
      return `symfony server:log --dir=${projectPath}`;
    } catch (error) {
      this.logger?.error(`Command ${this.getName()} failed: ${error}`);
      throw error;
    }
  }
};

// src/core/SymfonyCliManager.ts
var SymfonyCliManager = class {
  commands = /* @__PURE__ */ new Map();
  logger;
  constructor(processRunner) {
    this.registerCommand(new VersionCommand(processRunner));
    this.registerCommand(new ServerListCommand(processRunner));
    this.registerCommand(new PhpListCommand(processRunner));
    this.registerCommand(new ProxyStatusCommand(processRunner));
    this.registerCommand(new ServerStartCommand(processRunner));
    this.registerCommand(new ServerStopCommand(processRunner));
    this.registerCommand(new ProxyStartCommand(processRunner));
    this.registerCommand(new ProxyStopCommand(processRunner));
    this.registerCommand(new ProxyDomainDetachCommand(processRunner));
    this.registerCommand(new WhichSymfonyCommand(processRunner));
    this.registerCommand(new PhpInfoCommand(processRunner));
    this.registerCommand(new OpenLogCommand(processRunner));
  }
  setLogger(logger) {
    this.logger = logger;
    for (const command of this.commands.values()) {
      command.setLogger(logger);
    }
  }
  registerCommand(command) {
    if (this.logger) {
      command.setLogger(this.logger);
    }
    this.commands.set(command.getName(), command);
  }
  async runCommand(commandName, args) {
    try {
      const command = this.commands.get(commandName);
      if (!command) {
        this.logger?.error(`Command ${commandName} not found`);
        throw new Error(`Command ${commandName} not found`);
      }
      return await command.execute(args);
    } catch (error) {
      this.logger?.error(`Error running command ${commandName}: ${error}`);
      throw error;
    }
  }
};

// src/ui/Indicator.ts
import GObject from "gi://GObject";
import St2 from "gi://St";
import GLib2 from "gi://GLib";
import Clutter2 from "gi://Clutter";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

// src/ui/MenuBuilder.ts
import St from "gi://St";
import Gio2 from "gi://Gio";
import GLib from "gi://GLib";
import Clutter from "gi://Clutter";
import * as PopupMenu2 from "resource:///org/gnome/shell/ui/popupMenu.js";
var SYMFONY_DOCS_URL = "https://symfony.com/download";
var MenuBuilder = class {
  _logger;
  constructor(logger) {
    this._logger = logger;
  }
  buildMenu(menu, data, cliManager, extension) {
    console.log("[SymfonyMenubar] buildMenu zavolan\xE9!");
    menu.removeAll();
    const testItem = new PopupMenu2.PopupMenuItem("Test - Menu funguje!");
    menu.addMenuItem(testItem);
    console.log("[SymfonyMenubar] Testovacia polo\u017Eka pridan\xE1.");
    this._buildHeader(menu);
    menu.addMenuItem(new PopupMenu2.PopupSeparatorMenuItem());
    if (!data.cliAvailable) {
      this._buildCliErrorState(menu);
    } else {
      this._buildPhpSection(menu, data.phpVersions, data.phpInfoMap);
      menu.addMenuItem(new PopupMenu2.PopupSeparatorMenuItem());
      this._buildServersSection(menu, data.servers, data.proxyStatus.proxies, cliManager);
    }
    menu.addMenuItem(new PopupMenu2.PopupSeparatorMenuItem());
    this._buildFooter(menu, extension);
  }
  _buildHeader(menu) {
    const item = new PopupMenu2.PopupBaseMenuItem({ reactive: false, can_focus: false });
    const box = new St.BoxLayout({
      style_class: "symfony-header-box",
      x_expand: true
    });
    const title = new St.Label({
      text: "Symfony CLI",
      style: "font-weight: bold; font-size: 1.1em;",
      y_align: Clutter.ActorAlign.CENTER
    });
    const spacer = new St.Widget({ x_expand: true });
    const linkButton = new St.Button({ style_class: "icon-button" });
    const linkIcon = new St.Icon({
      icon_name: "external-link-symbolic",
      icon_size: 16
    });
    linkButton.set_child(linkIcon);
    linkButton.connect("clicked", () => {
      this._logger.info("Link to repo");
    });
    box.add_child(title);
    box.add_child(spacer);
    box.add_child(linkButton);
    item.add_child(box);
    menu.addMenuItem(item);
  }
  _buildCliErrorState(menu) {
    const errorItem = new PopupMenu2.PopupMenuItem("\u26A0  Symfony CLI nebolo n\xE1jden\xE9", {
      reactive: false
    });
    errorItem.label.add_style_class("cli-error-item");
    menu.addMenuItem(errorItem);
    const installItem = new PopupMenu2.PopupMenuItem("Kliknite pre n\xE1vod na in\u0161tal\xE1ciu");
    installItem.connect("activate", () => {
      try {
        Gio2.AppInfo.launch_default_for_uri(SYMFONY_DOCS_URL, null);
      } catch (e) {
        this._logger.error(`Failed to open docs URL: ${e}`);
      }
    });
    menu.addMenuItem(installItem);
  }
  _buildPhpSection(menu, versions, phpInfoMap) {
    for (const phpVersion of versions) {
      const label = phpVersion.isDefault ? `php ${phpVersion.version} (default)` : `php ${phpVersion.version}`;
      const item = new PopupMenu2.PopupSubMenuMenuItem(label);
      const info = phpInfoMap.get(phpVersion.version);
      if (info) {
        const iniText = info.phpIniPath ? `php.ini: ${info.phpIniPath}` : "php.ini: (nen\xE1jden\xE9)";
        const iniItem = new PopupMenu2.PopupMenuItem(iniText, { reactive: false });
        iniItem.label.add_style_class("small-gray-text");
        item.menu.addMenuItem(iniItem);
        const modulesText = this._buildModulesString(info);
        item.menu.addMenuItem(
          new PopupMenu2.PopupMenuItem(modulesText, { reactive: false })
        );
      }
      menu.addMenuItem(item);
    }
  }
  _buildModulesString(info) {
    const modules = [];
    modules.push(`APCu [${info.hasApcu ? "ok" : "\u2014"}]`);
    modules.push(`Xdebug [${info.hasXdebug ? "ok" : "\u2014"}]`);
    modules.push(`Opcache [${info.hasOpcache ? "ok" : "\u2014"}]`);
    return `Moduly: ${modules.join(", ")}`;
  }
  _buildServersSection(menu, servers, proxies, cliManager) {
    const favoriteServers = servers.filter(
      (s) => proxies.some((p) => p.directory === s.directory)
    );
    const otherServers = servers.filter(
      (s) => !proxies.some((p) => p.directory === s.directory)
    );
    const favTitleItem = new PopupMenu2.PopupBaseMenuItem({ reactive: false, can_focus: false });
    const favTitle = new St.Label({
      text: "OB\u013D\xDABEN\xC9 SERVERY",
      style_class: "section-title"
    });
    favTitleItem.add_child(favTitle);
    menu.addMenuItem(favTitleItem);
    if (favoriteServers.length === 0) {
      const emptyItem = new PopupMenu2.PopupMenuItem("(\u017Eiadne)", { reactive: false });
      emptyItem.label.add_style_class("small-gray-text");
      menu.addMenuItem(emptyItem);
    } else {
      for (const server of favoriteServers) {
        const proxy = proxies.find((p) => p.directory === server.directory);
        const domainName = proxy?.domain ?? server.directory.split("/").pop() ?? server.directory;
        menu.addMenuItem(this._buildServerItem(server, domainName, cliManager));
      }
    }
    const othersItem = new PopupMenu2.PopupSubMenuMenuItem("OSTATN\xC9 SERVERY");
    if (otherServers.length === 0) {
      const emptyItem = new PopupMenu2.PopupMenuItem("(\u017Eiadne)", { reactive: false });
      emptyItem.label.add_style_class("small-gray-text");
      othersItem.menu.addMenuItem(emptyItem);
    } else {
      for (const server of otherServers) {
        const domainName = server.directory.split("/").pop() ?? server.directory;
        othersItem.menu.addMenuItem(this._buildServerItem(server, domainName, cliManager));
      }
    }
    menu.addMenuItem(othersItem);
  }
  _buildServerItem(server, domainName, cliManager) {
    const statusDot = server.isRunning ? "\u25CF " : "\u25CB ";
    const item = new PopupMenu2.PopupSubMenuMenuItem(`${statusDot}${domainName}`);
    const portLabel = new St.Label({
      text: `:${server.port}`,
      style_class: "small-gray-text",
      x_align: Clutter.ActorAlign.END,
      y_align: Clutter.ActorAlign.CENTER
    });
    item.add_child(portLabel);
    this._buildServerDetail(item.menu, server, domainName, cliManager);
    return item;
  }
  _buildServerDetail(subMenu, server, domainName, cliManager) {
    const titleItem = new PopupMenu2.PopupBaseMenuItem({ reactive: false, can_focus: false });
    const titleLabel = new St.Label({
      text: domainName,
      style: "font-weight: bold;"
    });
    titleItem.add_child(titleLabel);
    subMenu.addMenuItem(titleItem);
    const statusItem = new PopupMenu2.PopupBaseMenuItem({ reactive: false, can_focus: false });
    const statusText = server.isRunning ? `Be\u017E\xED na porte ${server.port}` : "Zastaven\xFD";
    const statusLabel = new St.Label({
      text: statusText,
      style_class: server.isRunning ? "green-text" : "red-text"
    });
    statusItem.add_child(statusLabel);
    subMenu.addMenuItem(statusItem);
    subMenu.addMenuItem(new PopupMenu2.PopupSeparatorMenuItem());
    const toggleItem = new PopupMenu2.PopupMenuItem(
      server.isRunning ? "Zastavi\u0165 server" : "Spusti\u0165 server"
    );
    toggleItem.connect("activate", () => {
      const commandName = server.isRunning ? "server:stop" : "server:start";
      cliManager.runCommand(commandName, [`--dir=${server.directory}`]).catch((e) => {
        this._logger.error(`${commandName} failed: ${e}`);
      });
    });
    subMenu.addMenuItem(toggleItem);
    subMenu.addMenuItem(new PopupMenu2.PopupSeparatorMenuItem());
    if (server.isRunning && server.url) {
      const openItem = new PopupMenu2.PopupMenuItem("Otvori\u0165 v prehliada\u010Di");
      openItem.connect("activate", () => {
        try {
          Gio2.AppInfo.launch_default_for_uri(server.url, null);
        } catch (e) {
          this._logger.error(`Failed to open browser: ${e}`);
        }
      });
      subMenu.addMenuItem(openItem);
    }
    if (server.url) {
      const copyUrlItem = new PopupMenu2.PopupMenuItem("Kop\xEDrova\u0165 URL");
      copyUrlItem.connect("activate", () => {
        St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, server.url);
        this._logger.info(`Copied URL: ${server.url}`);
      });
      subMenu.addMenuItem(copyUrlItem);
    }
    subMenu.addMenuItem(new PopupMenu2.PopupSeparatorMenuItem());
    const logsItem = new PopupMenu2.PopupMenuItem("Zobrazi\u0165 logy");
    logsItem.connect("activate", () => {
      cliManager.runCommand("open:log", [server.directory]).then((cmd) => {
        try {
          GLib.spawn_command_line_async(`bash -c "${cmd}"`);
        } catch (e) {
          this._logger.error(`Failed to open logs: ${e}`);
        }
      }).catch((e) => this._logger.error(`open:log failed: ${e}`));
    });
    subMenu.addMenuItem(logsItem);
    subMenu.addMenuItem(new PopupMenu2.PopupSeparatorMenuItem());
    const pathItem = new PopupMenu2.PopupBaseMenuItem({ reactive: false, can_focus: false });
    const pathLabel = new St.Label({
      text: server.directory,
      style_class: "small-gray-text"
    });
    pathItem.add_child(pathLabel);
    subMenu.addMenuItem(pathItem);
    const actionsItem = new PopupMenu2.PopupBaseMenuItem({ reactive: false, can_focus: false });
    const actionsBox = new St.BoxLayout({ spacing: 8 });
    const copyPathBtn = this._makeTextButton("Kop\xEDrova\u0165 cestu", () => {
      St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, server.directory);
      this._logger.info(`Copied path: ${server.directory}`);
    });
    const folderBtn = this._makeTextButton("Prie\u010Dinok", () => {
      try {
        Gio2.AppInfo.launch_default_for_uri(`file://${server.directory}`, null);
      } catch (e) {
        this._logger.error(`Failed to open file manager: ${e}`);
      }
    });
    const terminalBtn = this._makeTextButton("Termin\xE1l", () => {
      try {
        GLib.spawn_command_line_async(`bash -c "cd '${server.directory}' && bash"`);
      } catch (e) {
        this._logger.error(`Failed to open terminal: ${e}`);
      }
    });
    actionsBox.add_child(copyPathBtn);
    actionsBox.add_child(folderBtn);
    actionsBox.add_child(terminalBtn);
    actionsItem.add_child(actionsBox);
    subMenu.addMenuItem(actionsItem);
  }
  _makeTextButton(label, onClick) {
    const btn = new St.Button({
      label,
      style_class: "button small-gray-text",
      x_expand: false
    });
    btn.connect("clicked", onClick);
    return btn;
  }
  _buildFooter(menu, extension) {
    const settingsItem = new PopupMenu2.PopupMenuItem("Nastavenia");
    settingsItem.connect("activate", () => {
      try {
        extension.openPreferences();
      } catch (e) {
        this._logger.error(`Failed to open preferences: ${e}`);
      }
    });
    menu.addMenuItem(settingsItem);
    const aboutItem = new PopupMenu2.PopupMenuItem("O aplik\xE1cii");
    aboutItem.connect("activate", () => {
      this._logger.info("About: Symfony CLI Menubar - GNOME Shell Extension");
    });
    menu.addMenuItem(aboutItem);
    const quitItem = new PopupMenu2.PopupMenuItem("Ukon\u010Di\u0165");
    quitItem.connect("activate", () => {
      this._logger.info("Quit requested by user");
    });
    menu.addMenuItem(quitItem);
  }
};

// src/ui/Indicator.ts
var Indicator = GObject.registerClass(
  class Indicator2 extends PanelMenu.Button {
    _cliManager;
    _menuBuilder;
    _logger;
    _extension;
    _timerId = null;
    _pendingRefresh = false;
    _init(cliManager, logger, extension) {
      super._init(0, "Symfony CLI Menubar", false);
      console.log("[SymfonyMenubar] Indicator inicializovan\xFD");
      this._cliManager = cliManager;
      this._logger = logger;
      this._extension = extension;
      this._menuBuilder = new MenuBuilder(logger);
      const label = new St2.Label({
        text: "Sf",
        y_align: Clutter2.ActorAlign.CENTER
      });
      this.add_child(label);
      this.menu.connect("open-state-changed", (_menu, isOpen) => {
        try {
          if (!isOpen && this._pendingRefresh) {
            this._doRefresh();
          }
        } catch (e) {
          this._logger.error(`Error in open-state-changed: ${e}`);
        }
      });
    }
    startRefresh(intervalSeconds = 10) {
      this._timerId = GLib2.timeout_add_seconds(
        GLib2.PRIORITY_DEFAULT,
        intervalSeconds,
        () => {
          try {
            this._refresh();
          } catch (e) {
            this._logger.error(`Error in refresh timer: ${e}`);
          }
          return GLib2.SOURCE_CONTINUE;
        }
      );
      this._doRefresh();
    }
    stopRefresh() {
      if (this._timerId !== null) {
        GLib2.source_remove(this._timerId);
        this._timerId = null;
      }
    }
    _refresh() {
      console.log("[SymfonyMenubar] Sp\xFA\u0161\u0165am _refresh...");
      if (this.menu.isOpen) {
        this._pendingRefresh = true;
        this._logger.info("Menu is open \u2013 deferring refresh");
        return;
      }
      this._doRefresh();
    }
    _doRefresh() {
      this._pendingRefresh = false;
      this._fetchData().then((data) => {
        try {
          this._menuBuilder.buildMenu(
            this.menu,
            data,
            this._cliManager,
            this._extension
          );
        } catch (e) {
          this._logger.error(`Error building menu: ${e}`);
          this._showErrorMenu(e);
        }
      }).catch((e) => {
        this._logger.error(`Menu refresh failed: ${e}`);
        this._showErrorMenu(e);
      });
    }
    _showErrorMenu(error) {
      try {
        this.menu.removeAll();
        this.menu.addMenuItem(new PopupMenu.PopupMenuItem(`Chyba: Pozri logy`, {
          reactive: false
        }));
        this._logger.error(`UI Fallback triggered due to: ${error}`);
      } catch (e) {
        this._logger.error(`Critical error in _showErrorMenu: ${e}`);
      }
    }
    async _fetchData() {
      try {
        const [phpResult, serverResult, proxyResult] = await Promise.allSettled([
          this._cliManager.runCommand("local:php:list"),
          this._cliManager.runCommand("server:list"),
          this._cliManager.runCommand("proxy:status")
        ]);
        if (phpResult.status === "rejected") {
          this._logger.warn(`local:php:list failed: ${phpResult.reason}`);
        }
        if (serverResult.status === "rejected") {
          this._logger.warn(`server:list failed: ${serverResult.reason}`);
        }
        if (proxyResult.status === "rejected") {
          this._logger.warn(`proxy:status failed: ${proxyResult.reason}`);
        }
        const phpVersions = phpResult.status === "fulfilled" ? phpResult.value : [];
        const servers = serverResult.status === "fulfilled" ? serverResult.value : [];
        const proxyStatus = proxyResult.status === "fulfilled" ? proxyResult.value : { isRunning: false, proxies: [] };
        const phpInfoMap = /* @__PURE__ */ new Map();
        await Promise.allSettled(
          phpVersions.filter((v) => v.path).map(async (v) => {
            try {
              const info = await this._cliManager.runCommand("php:info", [
                v.path
              ]);
              phpInfoMap.set(v.version, info);
            } catch (e) {
              this._logger.error(`Failed to fetch PHP info for ${v.version}: ${e}`);
            }
          })
        );
        const cliAvailable = phpVersions.length > 0 || servers.length > 0 || proxyStatus.proxies.length > 0;
        return { phpVersions, phpInfoMap, servers, proxyStatus, cliAvailable };
      } catch (e) {
        this._logger.error(`Error in _fetchData: ${e}`);
        throw e;
      }
    }
    destroy() {
      this.stopRefresh();
      super.destroy();
    }
  }
);

// src/extension.ts
var SymfonyMenubarExtension = class extends Extension {
  _indicator;
  enable() {
    try {
      const logger = new ConsoleLogger();
      const processRunner = new GjsProcessRunner(logger);
      const cliManager = new SymfonyCliManager(processRunner);
      cliManager.setLogger(logger);
      logger.info("Symfony Menubar Extension Enabled");
      this._indicator = new Indicator(cliManager, logger, this);
      Main.panel.addToStatusArea("symfony-menubar", this._indicator);
      this._indicator.startRefresh(10);
    } catch (e) {
      console.error(`[SymfonyMenubar] Failed to enable extension: ${e}`);
    }
  }
  disable() {
    try {
      this._indicator?.stopRefresh();
      this._indicator?.destroy();
      this._indicator = void 0;
      console.log("Symfony Menubar Disabled");
    } catch (e) {
      console.error(`[SymfonyMenubar] Error during disable: ${e}`);
    }
  }
};
export {
  SymfonyMenubarExtension as default
};
