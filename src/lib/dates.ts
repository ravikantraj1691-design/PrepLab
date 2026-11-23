// Date helpers — handle Excel serial dates, ISO strings, and "M/D/YYYY" strings.

export function excelSerialToISO(serial: number | string | null | undefined): string | null {
  if (serial === null || serial === undefined || serial === "") return null;
  const n = typeof serial === "string" ? parseFloat(serial) : serial;
  if (!Number.isFinite(n)) return null;
  const ms = Math.round((n - 25569) * 86400 * 1000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function parseFlexibleDate(input: unknown): string | null {
  if (input === null || input === undefined || input === "") return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input.toISOString();
  }
  if (typeof input === "number") return excelSerialToISO(input);
  if (typeof input === "string") {
    const s = input.trim();
    if (s === "" || s === "*") return null;
    const asNum = Number(s);
    if (!Number.isNaN(asNum) && s.match(/^\d+(\.\d+)?$/)) {
      return excelSerialToISO(asNum);
    }
    const iso = new Date(s);
    if (!Number.isNaN(iso.getTime())) return iso.toISOString();
    const m1 = s.match(
      /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i
    );
    if (m1) {
      const [, mo, da, yr, hh, mm, ss, ampm] = m1;
      let hour = hh ? parseInt(hh, 10) : 0;
      const minute = mm ? parseInt(mm, 10) : 0;
      const second = ss ? parseInt(ss, 10) : 0;
      if (ampm && ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (ampm && ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
      const d = new Date(
        Date.UTC(parseInt(yr, 10), parseInt(mo, 10) - 1, parseInt(da, 10), hour, minute, second)
      );
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const m2 = s.match(
      /^([A-Za-z]{3})[a-z]*\s+(\d{1,2}),?\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i
    );
    if (m2) {
      const [, mon, da, yr, hh, mm, ss, ampm] = m2;
      const mo = months[mon.toLowerCase().slice(0, 3)];
      if (mo !== undefined) {
        let hour = hh ? parseInt(hh, 10) : 0;
        const minute = mm ? parseInt(mm, 10) : 0;
        const second = ss ? parseInt(ss, 10) : 0;
        if (ampm && ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
        if (ampm && ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
        const d = new Date(Date.UTC(parseInt(yr, 10), mo, parseInt(da, 10), hour, minute, second));
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
    }
    const m3 = s.match(
      /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i
    );
    if (m3) {
      const [, da, mon, yr, hh, mm, ss, ampm] = m3;
      const mo = months[mon.toLowerCase().slice(0, 3)];
      if (mo !== undefined) {
        let hour = hh ? parseInt(hh, 10) : 0;
        const minute = mm ? parseInt(mm, 10) : 0;
        const second = ss ? parseInt(ss, 10) : 0;
        if (ampm && ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
        if (ampm && ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
        const d = new Date(Date.UTC(parseInt(yr, 10), mo, parseInt(da, 10), hour, minute, second));
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
    }
  }
  return null;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function toDatetimeInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function toDisplayDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mo = d.getUTCMonth() + 1;
  const da = d.getUTCDate();
  const yr = d.getUTCFullYear();
  let h = d.getUTCHours();
  const mi = d.getUTCMinutes();
  const ss = d.getUTCSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const mm = String(mi).padStart(2, "0");
  const ssStr = ss > 0 ? `:${String(ss).padStart(2, "0")}` : "";
  return `${mo}/${da}/${yr} ${String(h).padStart(2, "0")}:${mm}${ssStr} ${ampm}`;
}

export function toDisplayDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}
