import { useMemo, useState } from "react";
import {
  FileCheck2,
  Plus,
  Search,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const initialRules = [
  {
    id: 1,
    name: "Tax Compliance Status PIN",
    category: "Tax",
    required: true,
    expiryTracked: true,
    reminderDays: 30,
    active: true,
  },
  {
    id: 2,
    name: "COIDA Letter of Good Standing",
    category: "Health & Safety",
    required: true,
    expiryTracked: true,
    reminderDays: 30,
    active: true,
  },
  {
    id: 3,
    name: "B-BBEE Certificate / Affidavit",
    category: "Business Compliance",
    required: true,
    expiryTracked: true,
    reminderDays: 30,
    active: true,
  },
  {
    id: 4,
    name: "Public Liability Insurance",
    category: "Insurance",
    required: true,
    expiryTracked: true,
    reminderDays: 30,
    active: true,
  },
  {
    id: 5,
    name: "OHS Act s37(2) Agreement",
    category: "Health & Safety",
    required: true,
    expiryTracked: false,
    reminderDays: 30,
    active: true,
  },
];

export default function DocumentRules() {
  const [rules, setRules] = useState(initialRules);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    required: true,
    expiryTracked: true,
    reminderDays: 30,
  });

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        rule.name.toLowerCase().includes(search.toLowerCase()) ||
        rule.category.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && rule.active) ||
        (filter === "inactive" && !rule.active) ||
        (filter === "required" && rule.required);

      return matchesSearch && matchesFilter;
    });
  }, [rules, search, filter]);