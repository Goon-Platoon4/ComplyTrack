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

  function openNewRule() {
    setEditingId(null);
    setForm({
      name: "",
      category: "",
      required: true,
      expiryTracked: true,
      reminderDays: 30,
    });
    setMessage("");
    setShowForm(true);
  }

  function openEditRule(rule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      category: rule.category,
      required: rule.required,
      expiryTracked: rule.expiryTracked,
      reminderDays: rule.reminderDays,
    });
    setMessage("");
    setShowForm(true);
  }

  function saveRule(event) {
    event.preventDefault();

    const name = form.name.trim();
    const category = form.category.trim();
    const reminderDays = Number(form.reminderDays);

    if (!name || !category) {
      setMessage("Enter a document name and category.");
      return;
    }

    if (
      form.expiryTracked &&
      (!Number.isInteger(reminderDays) || reminderDays < 1)
    ) {
      setMessage("Enter a reminder period of at least 1 day.");
      return;
    }

    if (
      rules.some(
        (rule) =>
          rule.name.toLowerCase() === name.toLowerCase() &&
          rule.id !== editingId
      )
    ) {
      setMessage("A rule with this document name already exists.");
      return;
    }

    if (editingId !== null) {
      setRules((current) =>
        current.map((rule) =>
          rule.id === editingId
            ? {
                ...rule,
                ...form,
                name,
                category,
                reminderDays: form.expiryTracked ? reminderDays : 0,
              }
            : rule
        )
      );
    } else {
      setRules((current) => [
        ...current,
        {
          id: Math.max(0, ...current.map((rule) => rule.id)) + 1,
          ...form,
          name,
          category,
          reminderDays: form.expiryTracked ? reminderDays : 0,
          active: true,
        },
      ]);
    }
