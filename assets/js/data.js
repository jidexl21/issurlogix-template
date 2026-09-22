/* ============================================================
   LOGISTICS UI — Mock data layer (Phase 1, in-memory)
   Swap these functions for real API calls in Phase 2.
   ============================================================ */

const DB = (() => {
  "use strict";

  const DOC_TYPES = ["Insurance", "Vehicle Licence", "Roadworthiness"];

  /* ISO strings relative to today so the demo always looks current */
  const today = new Date();
  const addDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };
  const subDays = (n) => addDays(-n);

  /* ---------------- clients ---------------- */
  const clients = [
    { id: "CL-1001", name: "Adaeze Okafor", email: "adaeze.okafor@gmail.com", phone: "+234 801 234 5678", altPhone: "+234 901 234 5678", address: "14 Admiralty Way, Lekki Phase 1", city: "Lagos", state: "Lagos", account: "LG-2234" },
    { id: "CL-1002", name: "Chukwuemeka Obi", email: "emeka.obi@yahoo.com", phone: "+234 802 345 6789", altPhone: "", address: "23 Awolowo Rd, Ikeja", city: "Ikeja", state: "Lagos", account: "LG-2235" },
    { id: "CL-1003", name: "Fatima Bello", email: "fatima.bello@outlook.com", phone: "+234 803 456 7890", altPhone: "+234 805 456 7890", address: "7 Kudirat Abiola Way, Oregun", city: "Ikeja", state: "Lagos", account: "LG-2236" },
    { id: "CL-1004", name: "Oluwaseun Adeyemi", email: "seun.adeyemi@gmail.com", phone: "+234 805 678 9012", altPhone: "", address: "51 Prince Olumide St, Victoria Island", city: "Lagos", state: "Lagos", account: "LG-2237" },
    { id: "CL-1005", name: "Ngozi Eze", email: "ngozi.eze@mail.com", phone: "+234 806 789 0123", altPhone: "+234 807 890 1234", address: "18 Oba Akran Ave, Ikeja", city: "Ikeja", state: "Lagos", account: "LG-2238" },
    { id: "CL-1006", name: "Ibrahim Musa", email: "ibrahim.musa@gmail.com", phone: "+234 807 890 1234", altPhone: "", address: "9 Gwarinpa Estate, 3rd Avenue", city: "Abuja", state: "FCT", account: "LG-2239" },
    { id: "CL-1007", name: "Blessing Adebayo", email: "blessing.ade@gmail.com", phone: "+234 808 901 2345", altPhone: "+234 809 012 3456", address: "22 Osolo Way, Ajao Estate", city: "Lagos", state: "Lagos", account: "LG-2240" },
    { id: "CL-1008", name: "Kehinde Ogunleye", email: "kehinde.ogunleye@yahoo.com", phone: "+234 809 012 3456", altPhone: "", address: "3 Ribadu Rd, Ikoyi", city: "Lagos", state: "Lagos", account: "LG-2241" },
  ];

  /* ---------------- documents ---------------- */
  const documents = [
    {
      id: "DOC-5001", clientId: "CL-1001", type: "Insurance", number: "INS-884721",
      issueDate: subDays(330), expiryDate: addDays(35), policy: "Comprehensive",
      status: "Processing", batchId: null,
      history: [{ status: "Processing", at: subDays(6), note: "Application received, documents being verified." }],
      milestones: [],
    },
    {
      id: "DOC-5002", clientId: "CL-1001", type: "Vehicle Licence", number: "VL-992013",
      issueDate: subDays(300), expiryDate: addDays(65), policy: "",
      status: "Processing", batchId: null,
      history: [{ status: "Processing", at: subDays(4), note: "Licence renewal in progress." }],
      milestones: [],
    },
    {
      id: "DOC-5003", clientId: "CL-1002", type: "Roadworthiness", number: "RW-110482",
      issueDate: subDays(310), expiryDate: addDays(55), policy: "",
      status: "Awaiting Delivery", batchId: "BAT-9101",
      history: [
        { status: "Processing", at: subDays(12), note: "Inspection passed." },
        { status: "Awaiting Delivery", at: subDays(2), note: "Certificate printed, waiting to be assigned to a batch." },
      ],
      milestones: [],
    },
    {
      id: "DOC-5004", clientId: "CL-1003", type: "Insurance", number: "INS-771932",
      issueDate: subDays(360), expiryDate: addDays(5), policy: "Third Party, Fire & Theft",
      status: "Out For Delivery", batchId: "BAT-9102",
      history: [
        { status: "Processing", at: subDays(9), note: "Policy documents printed." },
        { status: "Awaiting Delivery", at: subDays(3), note: "Added to batch BAT-9102." },
        { status: "Out For Delivery", at: subDays(1), note: "Handed to rider for delivery." },
      ],
      milestones: [{ type: "Delivered by Rider", at: subDays(0), by: "Rider" }],
    },
    {
      id: "DOC-5005", clientId: "CL-1004", type: "Vehicle Licence", number: "VL-778120",
      issueDate: subDays(340), expiryDate: addDays(25), policy: "",
      status: "Delivered", batchId: "BAT-9103",
      history: [
        { status: "Processing", at: subDays(15), note: "Processing started." },
        { status: "Awaiting Delivery", at: subDays(10), note: "Ready for dispatch." },
        { status: "Out For Delivery", at: subDays(7), note: "Rider dispatched." },
        { status: "Delivered", at: subDays(5), note: "Handed to client's representative." },
      ],
      milestones: [{ type: "Delivered by Rider", at: subDays(5), by: "Rider" }],
    },
    {
      id: "DOC-5006", clientId: "CL-1005", type: "Insurance", number: "INS-601283",
      issueDate: subDays(200), expiryDate: addDays(165), policy: "Comprehensive",
      status: "Processing", batchId: null,
      history: [{ status: "Processing", at: subDays(2), note: "New policy application being underwritten." }],
      milestones: [],
    },
    {
      id: "DOC-5007", clientId: "CL-1006", type: "Roadworthiness", number: "RW-991243",
      issueDate: subDays(250), expiryDate: addDays(115), policy: "",
      status: "Returned", batchId: "BAT-9101",
      history: [
        { status: "Processing", at: subDays(20), note: "Certificate issued." },
        { status: "Awaiting Delivery", at: subDays(18), note: "Dispatched in BAT-9101." },
        { status: "Out For Delivery", at: subDays(17), note: "Attempted delivery — address unreachable." },
        { status: "Returned", at: subDays(12), note: "Returned to office. Re-delivery scheduled." },
      ],
      milestones: [],
    },
    {
      id: "DOC-5008", clientId: "CL-1007", type: "Vehicle Licence", number: "VL-433215",
      issueDate: subDays(380), expiryDate: subDays(15), policy: "",
      status: "Processing", batchId: null,
      history: [{ status: "Processing", at: subDays(3), note: "Renewal (overdue) in progress." }],
      milestones: [],
    },
    {
      id: "DOC-5009", clientId: "CL-1008", type: "Insurance", number: "INS-909852",
      issueDate: subDays(150), expiryDate: addDays(215), policy: "Comprehensive",
      status: "Accepted by Client", batchId: "BAT-9103",
      history: [
        { status: "Processing", at: subDays(30), note: "Policy issued." },
        { status: "Awaiting Delivery", at: subDays(26), note: "Dispatched." },
        { status: "Out For Delivery", at: subDays(25), note: "With rider." },
        { status: "Delivered", at: subDays(22), note: "Delivered." },
        { status: "Accepted by Client", at: subDays(20), note: "Client accepted with delivery token." },
      ],
      milestones: [
        { type: "Delivered by Rider", at: subDays(22), by: "Rider" },
        { type: "Marked as Received", at: subDays(20), by: "Client" },
      ],
    },
    {
      id: "DOC-5010", clientId: "CL-1002", type: "Vehicle Licence", number: "VL-112904",
      issueDate: subDays(330), expiryDate: addDays(35), policy: "",
      status: "Out For Delivery", batchId: "BAT-9101",
      history: [
        { status: "Processing", at: subDays(8), note: "Renewed." },
        { status: "Awaiting Delivery", at: subDays(2), note: "In batch BAT-9101." },
        { status: "Out For Delivery", at: subDays(1), note: "With rider Tunde Bakare." },
      ],
      milestones: [],
    },
    {
      id: "DOC-5011", clientId: "CL-1003", type: "Roadworthiness", number: "RW-556701",
      issueDate: subDays(280), expiryDate: addDays(85), policy: "",
      status: "Processing", batchId: null,
      history: [{ status: "Processing", at: subDays(1), note: "Test pending." }],
      milestones: [],
    },
    {
      id: "DOC-5012", clientId: "CL-1005", type: "Roadworthiness", number: "RW-332410",
      issueDate: subDays(330), expiryDate: addDays(35), policy: "",
      status: "Delivered", batchId: "BAT-9103",
      history: [
        { status: "Processing", at: subDays(18), note: "Certificate issued." },
        { status: "Awaiting Delivery", at: subDays(14), note: "In batch." },
        { status: "Out For Delivery", at: subDays(12), note: "With rider." },
        { status: "Delivered", at: subDays(10), note: "Delivered. Awaits client acceptance." },
      ],
      milestones: [{ type: "Delivered by Rider", at: subDays(10), by: "Rider" }],
    },
  ];

  /* ---------------- riders ---------------- */
  const riders = [
    { id: "RD-01", name: "Tunde Bakare", phone: "+234 812 000 1111", email: "tunde.bakare@dispatch.com", status: "Active", regNo: "RC-441" },
    { id: "RD-02", name: "Samuel Adekunle", phone: "+234 812 111 2222", email: "samuel.adekunle@dispatch.com", status: "Active", regNo: "RC-442" },
    { id: "RD-03", name: "Mary Johnson", phone: "+234 812 222 3333", email: "mary.johnson@dispatch.com", status: "Active", regNo: "RC-443" },
    { id: "RD-04", name: "Yusuf Ibrahim", phone: "+234 812 333 4444", email: "yusuf.ibrahim@dispatch.com", status: "On Leave", regNo: "RC-444" },
  ];

  /* ---------------- batches ---------------- */
  const batches = [
    {
      id: "BAT-9101", name: "Lekki & VI Run", createdAt: subDays(2), status: "Awaiting Pickup",
      riderId: "RD-01", items: ["DOC-5003", "DOC-5010", "DOC-5007"], vehicle: "Yamaha · RGC-482-KJ",
      pickup: { address: "Head Office, 5 Logistics Way, Ikeja", time: subDays(1) },
    },
    {
      id: "BAT-9102", name: "Ikeja Loop", createdAt: subDays(3), status: "In Transit",
      riderId: "RD-02", items: ["DOC-5004"], vehicle: "TVS · AAA-109-LA",
      pickup: { address: "Head Office, 5 Logistics Way, Ikeja", time: subDays(3) },
    },
    {
      id: "BAT-9103", name: "Island Central", createdAt: subDays(11), status: "Partially Delivered",
      riderId: "RD-03", items: ["DOC-5005", "DOC-5009", "DOC-5012"], vehicle: "Honda · BCC-771-LA",
      pickup: { address: "Head Office, 5 Logistics Way, Ikeja", time: subDays(10) },
    },
    {
      id: "BAT-9104", name: "Abuja Dispatch", createdAt: subDays(4), status: "Awaiting Pickup",
      riderId: "RD-04", items: [], vehicle: "Unassigned",
      pickup: { address: "Head Office, 5 Logistics Way, Ikeja", time: null },
    },
  ];

  /* ---------------- reminders ---------------- */
  const reminders = [
    { id: "RM-7001", clientId: "CL-1001", docId: "DOC-5001", type: "Insurance", channel: "WhatsApp", status: "Scheduled", at: addDays(3), } ,
    { id: "RM-7002", clientId: "CL-1003", docId: "DOC-5004", type: "Insurance", channel: "Email", status: "Scheduled", at: addDays(1) },
    { id: "RM-7003", clientId: "CL-1008", docId: "DOC-5008", type: "Vehicle Licence", channel: "Phone", status: "Sent", at: subDays(1) },
    { id: "RM-7004", clientId: "CL-1002", docId: "DOC-5010", type: "Vehicle Licence", channel: "WhatsApp", status: "Scheduled", at: addDays(5) },
    { id: "RM-7005", clientId: "CL-1005", docId: "DOC-5006", type: "Insurance", channel: "Email", status: "Sent", at: subDays(2) },
  ];

  /* ---------------- invoices ---------------- */
  const invoices = [
    {
      id: "INV-8101", clientId: "CL-1003", number: "INV-2026-081", date: subDays(6), dueDate: addDays(24),
      status: "Unpaid",
      items: [
        { desc: "Renewal premium — Insurance (Third Party, Fire & Theft)", amount: 85000 },
        { desc: "Logistics / delivery fee", amount: 3000 },
        { desc: "Document processing", amount: 1500 },
      ],
    },
    {
      id: "INV-8102", clientId: "CL-1001", number: "INV-2026-082", date: subDays(9), dueDate: addDays(21),
      status: "Partial",
      items: [
        { desc: "Renewal premium — Insurance (Comprehensive)", amount: 180000 },
        { desc: "Vehicle licence processing", amount: 7000 },
        { desc: "Logistics / delivery fee", amount: 3500 },
      ],
    },
    {
      id: "INV-8103", clientId: "CL-1005", number: "INV-2026-083", date: subDays(15), dueDate: addDays(45),
      status: "Unpaid",
      items: [
        { desc: "New policy premium — Insurance (Comprehensive)", amount: 240000 },
        { desc: "Document processing", amount: 2000 },
      ],
    },
    {
      id: "INV-8104", clientId: "CL-1008", number: "INV-2026-084", date: subDays(25), dueDate: subDays(2),
      status: "Overdue",
      items: [
        { desc: "Renewal premium — Insurance (Comprehensive)", amount: 150000 },
        { desc: "Logistics / delivery fee", amount: 3000 },
      ],
    },
    {
      id: "INV-8105", clientId: "CL-1006", number: "INV-2026-085", date: subDays(35), dueDate: subDays(12),
      status: "Paid",
      items: [
        { desc: "Roadworthiness certificate fee", amount: 12000 },
        { desc: "Logistics / delivery fee", amount: 6500 },
      ],
    },
  ];

  /* ---------------- runtime tokens ---------------- */
  const tokens = new Map();

  /* ---------------- lookups ---------------- */
  const getClient = (id) => clients.find((c) => c.id === id);
  const getRider = (id) => riders.find((r) => r.id === id);
  const getDoc = (id) => documents.find((d) => d.id === id);
  const getBatch = (id) => batches.find((b) => b.id === id);
  const getInvoice = (id) => invoices.find((i) => i.id === id);

  const docsOfClient = (cid) => documents.filter((d) => d.clientId === cid);
  const invoicesOfClient = (cid) => invoices.filter((i) => i.clientId === cid);
  const docsOfBatch = (bid) => documents.filter((d) => d.batchId === bid);
  const activeBatchesOfRider = (rid) => batches.filter((b) => b.riderId === rid && b.status !== "Completed");

  const renewals = () =>
    documents
      .map((d) => ({ ...d, daysLeft: App.daysUntil(d.expiryDate) }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

  const statusCounts = () => {
    const counts = { "Processing": 0, "Awaiting Delivery": 0, "Out For Delivery": 0, "Delivered": 0, "Returned": 0, "Accepted by Client": 0 };
    documents.forEach((d) => {
      if (counts[d.status] !== undefined) counts[d.status] += 1;
    });
    return counts;
  };

  const stats = () => {
    const dueSoon = documents.filter((d) => {
      const dl = App.daysUntil(d.expiryDate);
      return dl >= 0 && dl <= 30;
    }).length;
    const overdue = documents.filter((d) => App.daysUntil(d.expiryDate) < 0).length;
    const outForDelivery = statusCounts()["Out For Delivery"];
    const inProcessing = statusCounts()["Processing"];
    const delivered = statusCounts()["Delivered"] + statusCounts()["Accepted by Client"];
    const unpaid = invoices
      .filter((i) => i.status === "Unpaid" || i.status === "Overdue")
      .reduce((s, i) => s + i.items.reduce((x, it) => x + it.amount, 0), 0);
    return { dueSoon, overdue, outForDelivery, inProcessing, delivered, unpaid };
  };

  const activity = () => {
    const feed = [];
    documents.forEach((d) => {
      const last = d.history[d.history.length - 1];
      if (last) feed.push({ type: "doc", docId: d.id, status: last.status, note: last.note, at: last.at, clientId: d.clientId });
    });
    invoices.forEach((i) => feed.push({ type: "invoice", docId: null, status: i.status, note: `Invoice ${i.number} is ${i.status.toLowerCase()}`, at: i.date, clientId: i.clientId }));
    batches.forEach((b) => feed.push({ type: "batch", docId: null, status: b.status, note: `Batch ${b.name} (${b.id}) — ${b.status}`, at: b.createdAt, clientId: null }));
    return feed
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 9);
  };

  /* ---------------- mutations (mock) ---------------- */
  const advanceDoc = (docId) => {
    const d = getDoc(docId);
    if (!d) return null;
    const next = App.nextStatus(d.status);
    if (!next) return null;
    d.status = next;
    d.history.push({ status: next, at: new Date().toISOString(), note: `Status updated to "${next}".` });
    return d;
  };

  const markReturned = (docId, note) => {
    const d = getDoc(docId);
    if (!d) return null;
    d.status = "Returned";
    d.history.push({ status: "Returned", at: new Date().toISOString(), note: note || "Document returned." });
    return d;
  };

  const pushMilestone = (docId, type, by) => {
    const d = getDoc(docId);
    if (!d) return;
    d.milestones.push({ type, at: new Date().toISOString(), by });
  };

  const addClient = (data) => {
    const id = "CL-" + String(1000 + clients.length + 1);
    clients.push({ ...data, id, account: "LG-" + (2234 + clients.length) });
    return id;
  };

  const addDocument = (data) => {
    const id = "DOC-" + (5000 + documents.length + 1);
    const doc = {
      ...data,
      id,
      status: "Processing",
      batchId: null,
      milestones: [],
      history: [{ status: "Processing", at: new Date().toISOString(), note: "Document added to processing." }],
    };
    documents.push(doc);
    return doc;
  };

  const addRider = (data) => {
    const id = "RD-" + String(riders.length + 1).padStart(2, "0");
    riders.push({ ...data, id });
    return id;
  };

  const createBatch = (name, riderId, docIds, vehicle) => {
    const id = "BAT-" + (9100 + batches.length + 1);
    const batch = {
      id, name, createdAt: new Date().toISOString(), status: "Awaiting Pickup",
      riderId: riderId || null, items: docIds, vehicle: vehicle || "Unassigned",
      pickup: { address: "Head Office, 5 Logistics Way, Ikeja", time: null },
    };
    batches.unshift(batch);
    docIds.forEach((did) => {
      const d = getDoc(did);
      if (d) {
        d.batchId = id;
        d.status = "Awaiting Delivery";
        d.history.push({ status: "Awaiting Delivery", at: new Date().toISOString(), note: `Added to batch ${name}` });
      }
    });
    return batch;
  };

  const payInvoice = (invoiceId, amount) => {
    const inv = getInvoice(invoiceId);
    if (!inv) return;
    inv.status = "Paid";
  };

  const createToken = (key, code, channel, docIds) => {
    tokens.set(key, { code, channel, docIds: docIds || [], issuedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 15 * 60000).toISOString(), valid: true });
  };

  const validateToken = (key, code) => {
    const t = tokens.get(key);
    if (!t || !t.valid) return { ok: false, reason: "No active token for this delivery." };
    if (new Date(t.expiresAt) < new Date()) {
      t.valid = false;
      return { ok: false, reason: "Token expired. Request a new one." };
    }
    if (t.code !== code) return { ok: false, reason: "Incorrect token. Please check and try again." };
    t.valid = false;
    const accepted = (t.docIds || []).map((id) => getDoc(id)).filter(Boolean);
    accepted.forEach((d) => {
      d.status = "Accepted by Client";
      d.history.push({ status: "Accepted by Client", at: new Date().toISOString(), note: "Client accepted delivery with delivery token." });
      pushMilestone(d.id, "Marked as Received", "Client");
    });
    return { ok: true, accepted: accepted.map((d) => d.id) };
  };

  const issueReminder = (remId, channel) => {
    const r = reminders.find((x) => x.id === remId);
    if (!r) return;
    r.channel = channel || r.channel;
    r.status = "Sent";
    r.at = new Date().toISOString();
  };

  const nextInvoiceNumber = () =>
    "INV-2026-" + String(86 + invoices.length).padStart(3, "0");

  const createInvoice = (clientId, items, dueInDays = 30) => {
    const inv = {
      id: "INV-" + (8100 + invoices.length + 1),
      clientId, number: nextInvoiceNumber(),
      date: new Date().toISOString(), dueDate: addDays(dueInDays),
      status: "Unpaid", items,
    };
    invoices.unshift(inv);
    return inv;
  };

  return {
    DOC_TYPES,
    clients,
    documents,
    riders,
    batches,
    reminders,
    invoices,
    tokens,
    getClient,
    getRider,
    getDoc,
    getBatch,
    getInvoice,
    docsOfClient,
    invoicesOfClient,
    docsOfBatch,
    activeBatchesOfRider,
    renewals,
    statusCounts,
    stats,
    activity,
    advanceDoc,
    markReturned,
    pushMilestone,
    addClient,
    addDocument,
    addRider,
    createBatch,
    payInvoice,
    createToken,
    validateToken,
    issueReminder,
    createInvoice,
    nextInvoiceNumber,
  };
})();