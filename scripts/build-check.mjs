import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["backend/src", "frontend", "scripts"];
const files = [];

for (const root of roots) {
  await collectJavaScriptFiles(root);
}

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });

  if (result.error) {
    console.error(`No se pudo validar ${file}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Fallo de sintaxis en ${file}`);
    console.error(result.stderr || result.stdout || "Sin detalle entregado por Node.");
    process.exit(result.status ?? 1);
  }
}

console.log(`Build check OK: ${files.length} archivos validados.`);

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      await collectJavaScriptFiles(fullPath);
      continue;
    }

    if ([".js", ".mjs"].includes(extname(entry.name))) {
      files.push(fullPath);
    }
  }
}
