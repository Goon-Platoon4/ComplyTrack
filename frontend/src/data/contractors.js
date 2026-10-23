const requiredDocumentNames = [
  "Tax Compliance Status PIN",
  "COIDA Letter of Good Standing",
  "B-BBEE certificate / affidavit",
  "Public liability insurance",
  "OHS Act s37(2) agreement",
];

export const contractors = [
  {
    id: "CNT-001",
    name: "Apex Construction Ltd",
    regNo: "2018/482011/07",
    contactPerson: "Thandi Nkosi",
    email: "thandi@apexconstruction.co.za",
    phone: "+27 82 555 0192",
    category: "Construction",
    worksOnSite: true,
    contractStart: "1 Mar 2025",
    contractEnd: "28 Feb 2027",
    documents: [
      { name: requiredDocumentNames[0], status: "Valid", issued: "15 Mar 2026", expiry: "15 Mar 2027", reference: "TCS-APX-2026", file: "tax-compliance-pin.pdf" },
      { name: requiredDocumentNames[1], status: "Valid", issued: "30 Nov 2025", expiry: "30 Nov 2026", reference: "COIDA-APX-441", file: "coida-letter.pdf" },
      { name: requiredDocumentNames[2], status: "Expiring soon", issued: "28 Oct 2025", expiry: "28 Oct 2026", reference: "BBEE-APX-L2", file: "bbbee-certificate.pdf" },
      { name: requiredDocumentNames[3], status: "Valid", issued: "1 Jan 2026", expiry: "31 Dec 2026", reference: "POL-APX-901", file: "liability-policy.pdf" },
      { name: requiredDocumentNames[4], status: "Missing", issued: null, expiry: null, reference: null, file: null },
    ],
    activity: [
      { action: "Public liability insurance uploaded", user: "Thandi Nkosi", date: "12 Oct 2026, 10:42" },
      { action: "COIDA letter renewed", user: "Thandi Nkosi", date: "1 Jun 2026, 14:18" },
      { action: "Contractor record created", user: "Sipho Dube", date: "1 Mar 2025, 09:05" },
    ],
    reminders: [
      { document: "B-BBEE certificate / affidavit", sent: "14 Oct 2026", due: "28 Oct 2026", channel: "Email", status: "Sent" },
      { document: "COIDA Letter of Good Standing", sent: "16 Oct 2026", due: "30 Nov 2026", channel: "Email", status: "Sent" },
    ],
  },
  {
    id: "CNT-002",
    name: "Vanguard Electrical Services",
    regNo: "2015/109382/07",
    contactPerson: "Johan Pretorius",
    email: "johan@vanguard-electrical.co.za",
    phone: "+27 83 444 1209",
    category: "Electrical",
    worksOnSite: true,
    contractStart: "1 Jul 2024",
    contractEnd: "30 Jun 2027",
    documents: [
      { name: requiredDocumentNames[0], status: "Expired", issued: "30 Sep 2025", expiry: "30 Sep 2026", reference: "TCS-VAN-2025", file: "tax-pin-2025.pdf" },
      { name: requiredDocumentNames[1], status: "Valid", issued: "20 May 2026", expiry: "20 May 2027", reference: "COIDA-VAN-711", file: "coida-letter.pdf" },
      { name: requiredDocumentNames[2], status: "Valid", issued: "2 Feb 2026", expiry: "2 Feb 2027", reference: "BBEE-VAN-2026", file: "bbbee-affidavit.pdf" },
      { name: requiredDocumentNames[3], status: "Expiring soon", issued: "14 Oct 2025", expiry: "14 Oct 2026", reference: "POL-VAN-114", file: "liability-insurance.pdf" },
      { name: requiredDocumentNames[4], status: "Valid", issued: "1 Jul 2026", expiry: "30 Jun 2027", reference: "OHS-VAN-2026", file: "ohs-agreement.pdf" },
    ],
    activity: [
      { action: "Wireman license added to contractor file", user: "Thandi Nkosi", date: "8 Oct 2026, 11:16" },
      { action: "Expiry reminder sent", user: "System", date: "1 Oct 2026, 08:00" },
      { action: "Contractor record created", user: "Sipho Dube", date: "1 Jul 2024, 13:22" },
    ],
    reminders: [
      { document: "Public liability insurance", sent: "1 Oct 2026", due: "14 Oct 2026", channel: "Email", status: "Sent" },
      { document: "Tax Compliance Status PIN", sent: "1 Sep 2026", due: "30 Sep 2026", channel: "Email", status: "Sent" },
    ],
  },
  {
    id: "CNT-003",
    name: "Siphumelele Security & Civils",
    regNo: "2020/774912/07",
    contactPerson: "Siyabonga Dlamini",
    email: "siyabonga@siphumelele.co.za",
    phone: "+27 71 987 6543",
    category: "Security",
    worksOnSite: true,
    contractStart: "1 Sep 2025",
    contractEnd: "31 Aug 2027",
    documents: [
      { name: requiredDocumentNames[0], status: "Expired", issued: "10 Sep 2025", expiry: "10 Sep 2026", reference: "TCS-SIP-2025", file: "tax-pin.pdf" },
      { name: requiredDocumentNames[1], status: "Expired", issued: "15 Sep 2025", expiry: "15 Sep 2026", reference: "COIDA-SIP-251", file: "coida-letter.pdf" },
      { name: requiredDocumentNames[2], status: "Valid", issued: "1 Apr 2026", expiry: "31 Mar 2027", reference: "BBEE-SIP-2026", file: "bbbee-affidavit.pdf" },
      { name: requiredDocumentNames[3], status: "Missing", issued: null, expiry: null, reference: null, file: null },
      { name: requiredDocumentNames[4], status: "Valid", issued: "1 Sep 2026", expiry: "31 Aug 2027", reference: "OHS-SIP-2026", file: "ohs-agreement.pdf" },
    ],
    activity: [
      { action: "COIDA letter marked expired", user: "System", date: "16 Sep 2026, 00:01" },
      { action: "Compliance reminder sent", user: "Thandi Nkosi", date: "17 Sep 2026, 09:30" },
      { action: "Contractor record created", user: "Thandi Nkosi", date: "1 Sep 2025, 15:40" },
    ],
    reminders: [
      { document: "Tax Compliance Status PIN", sent: "1 Sep 2026", due: "10 Sep 2026", channel: "Email", status: "Sent" },
      { document: "COIDA Letter of Good Standing", sent: "5 Sep 2026", due: "15 Sep 2026", channel: "Email", status: "Sent" },
    ],
  },
  {
    id: "CNT-004",
    name: "BlueHorizon Facilities Management",
    regNo: "2022/663221/08",
    contactPerson: "Lerato Mokoena",
    email: "lerato@bluehorizonfm.co.za",
    phone: "+27 82 778 2100",
    category: "Facilities",
    worksOnSite: false,
    contractStart: "1 Jan 2026",
    contractEnd: "31 Dec 2027",
    documents: [
      { name: requiredDocumentNames[0], status: "Valid", issued: "20 Jan 2026", expiry: "20 Jan 2027", reference: "TCS-BHF-2026", file: "tax-pin.pdf" },
      { name: requiredDocumentNames[1], status: "Valid", issued: "5 Feb 2026", expiry: "5 Feb 2027", reference: "COIDA-BHF-112", file: "coida-letter.pdf" },
      { name: requiredDocumentNames[2], status: "Valid", issued: "5 Aug 2026", expiry: "5 Aug 2027", reference: "BBEE-BHF-2026", file: "bbbee-affidavit.pdf" },
      { name: requiredDocumentNames[3], status: "Valid", issued: "11 Feb 2026", expiry: "11 Feb 2027", reference: "POL-BHF-2026", file: "liability-policy.pdf" },
      { name: requiredDocumentNames[4], status: "Valid", issued: "1 Jan 2026", expiry: "31 Dec 2027", reference: "OHS-BHF-2026", file: "ohs-agreement.pdf" },
    ],
    activity: [
      { action: "B-BBEE affidavit uploaded", user: "Thandi Nkosi", date: "6 Aug 2026, 12:03" },
      { action: "Contractor profile updated", user: "Lerato Mokoena", date: "5 Aug 2026, 16:45" },
      { action: "Contractor record created", user: "Thandi Nkosi", date: "1 Jan 2026, 08:30" },
    ],
    reminders: [
      { document: "Public liability insurance", sent: "12 Jan 2027", due: "11 Feb 2027", channel: "Email", status: "Scheduled" },
    ],
  },
];

export const requiredDocuments = requiredDocumentNames;

export function getComplianceStatus(contractor) {
  const statuses = contractor.documents.map((document) => document.status);
  if (statuses.includes("Expired")) return "Expired";
  if (statuses.includes("Missing")) return "Missing";
  if (statuses.includes("Expiring soon")) return "Expiring soon";
  return "Compliant";
}
