import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, CircleDollarSign, ClipboardList, LayoutDashboard, LogOut, Mail, Pencil, Plus, Printer, Search, ShieldCheck, Stethoscope, Trash2, UsersRound, Wallet, X } from "lucide-react";
import { requireSupabase } from "./lib/supabase";

const emptyForm = { first_name: "", last_name: "", birth_date: "", age: "", contact: "", quartier: "", home_address: "", city: "" };
const emptyPrescriptionForm = {
  medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
  instructions: "",
  practitioner: "",
  issued_at: getLocalDateTimeValue(),
};
const emptyClinicalNoteForm = {
  patient_id: "",
  title: "",
  content: "",
  practitioner: "",
  occurred_at: getLocalDateTimeValue(),
};
const services = [
  { label: "Consultation générale", icon: "🩺" },
  { label: "Consultation spécialisée", icon: "🧑‍⚕️" },
  { label: "Visite à domicile", icon: "🏠" },
  { label: "Suivi / contrôle", icon: "📋" },
  { label: "Soins infirmiers", icon: "💉" },
  { label: "Analyses / laboratoire", icon: "🧪" },
  { label: "Imagerie médicale", icon: "🩻" },
  { label: "Vaccination", icon: "💊" },
  { label: "Autre prestation", icon: "✚" },
];
const demoPatients = [
  { id: "demo-patient-1", full_name: "Aïssatou Bah (démo)", birth_date: "1992-05-11", age: 34, contact: "+224 000 00 01", quartier: "Kaloum", home_address: "Adresse fictive 1", city: "Conakry", created_at: "2026-10-15T10:00:00Z" },
  { id: "demo-patient-2", full_name: "Mamadou Diallo (démo)", birth_date: "1980-05-11", age: 46, contact: "+224 000 00 02", quartier: "Centre-ville", home_address: "Adresse fictive 2", city: "Kindia", created_at: "2026-10-14T10:00:00Z" },
  { id: "demo-patient-3", full_name: "Fatoumata Camara (démo)", birth_date: "1998-05-11", age: 28, contact: "+224 000 00 03", quartier: "Downtown", home_address: "Adresse fictive 3", city: "Labé", created_at: "2026-10-13T10:00:00Z" },
];

function getDisplayName(user) {
  return user.user_metadata?.full_name || user.email || "votre espace Clinic DC";
}

function getLocalDateTimeValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getLocalDateKey(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function formatAmount(amount) {
  return new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(amount);
}

function getGuineaNationalNumber(contact = "") {
  return contact.replace(/^\s*\+?224\s*/, "");
}

function splitPatientName(fullName = "") {
  const [firstName = "", ...lastNameParts] = fullName.trim().split(/\s+/);
  return { first_name: firstName, last_name: lastNameParts.join(" ") };
}

function getAgeFromBirthDate(birthDate) {
  if (!birthDate) return "";
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age;
}

function getPatientAgeGroup(age) {
  if (age === "" || age == null || !Number.isFinite(Number(age))) return "";
  if (Number(age) < 12) return "Enfant";
  if (Number(age) < 18) return "Ado";
  return "Adulte";
}

function PatientSelect({ options, value, onChange, labelId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectRef = useRef(null);
  const searchRef = useRef(null);
  const listboxId = useId();
  const selectedPatient = options.find((patient) => patient.id === value);
  const filteredOptions = useMemo(() => {
    const normalizeText = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
    const normalizedQuery = normalizeText(query.trim());
    if (!normalizedQuery) return options;
    const phoneQuery = normalizedQuery.replace(/\D/g, "");
    return options.filter((patient) => (
      normalizeText(patient.label).includes(normalizedQuery)
      || (phoneQuery && (patient.contact ?? "").replace(/\D/g, "").includes(phoneQuery))
      || normalizeText(patient.city ?? "").includes(normalizedQuery)
    ));
  }, [options, query]);

  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const closeList = () => {
    setIsOpen(false);
    setQuery("");
  };

  const selectPatient = (patient) => {
    onChange(patient.id);
    closeList();
  };

  const focusOption = (event, direction) => {
    event.preventDefault();
    const options = Array.from(event.currentTarget.parentElement.querySelectorAll('[role="option"]'));
    const currentIndex = options.indexOf(event.currentTarget);
    const nextOption = options[currentIndex + direction];
    if (nextOption) nextOption.focus();
  };

  const getPatientDetails = (patient) => [
    patient.age == null ? "Âge non renseigné" : `${patient.age} ans`,
    patient.city || "Ville non renseignée",
    patient.contact || "Contact non renseigné",
  ].join(" · ");

  return (
    <div className={`patient-select${isOpen ? " patient-select--open" : ""}`} ref={selectRef}>
      <button
        className="patient-select__trigger"
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-required="true"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          if (isOpen) closeList();
          else setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        {selectedPatient ? (
          <>
            <span className="patient-select__avatar" aria-hidden="true">{selectedPatient.label.trim().charAt(0).toLocaleUpperCase()}</span>
            <span className="patient-select__copy">
              <strong>{selectedPatient.label.replace(/\s*\(démo\)$/i, "")}</strong>
              <small>{selectedPatient.contact || "Coordonnées non renseignées"}</small>
            </span>
          </>
        ) : (
          <span className="patient-select__placeholder">Choisir un patient</span>
        )}
        <ChevronDown className={`patient-select__chevron${isOpen ? " patient-select__chevron--open" : ""}`} size={16} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="patient-select__menu">
          <div className="patient-select__search">
            <Search size={15} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="Rechercher un nom, une ville ou un numéro…"
              aria-label="Rechercher un patient"
              aria-controls={listboxId}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeList();
                  selectRef.current?.querySelector(".patient-select__trigger")?.focus();
                } else if (event.key === "ArrowDown") {
                  event.preventDefault();
                  selectRef.current?.querySelector('[role="option"]')?.focus();
                } else if (event.key === "Enter" && filteredOptions[0]) {
                  event.preventDefault();
                  selectPatient(filteredOptions[0]);
                }
              }}
            />
          </div>
          <div className="patient-select__results" id={listboxId} role="listbox" aria-label="Résultats des patients">
            <span className="patient-select__count">
              {filteredOptions.length} {filteredOptions.length > 1 ? "patients" : "patient"}
            </span>
            {filteredOptions.length > 0 ? filteredOptions.map((patient) => {
              const isSelected = patient.id === value;
              const isDemo = /\(démo\)$/i.test(patient.label);
              return (
                <button
                  className={`patient-select__option${isSelected ? " patient-select__option--selected" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  key={patient.id}
                  onClick={() => selectPatient(patient)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      closeList();
                      selectRef.current?.querySelector(".patient-select__trigger")?.focus();
                    } else if (event.key === "ArrowDown") {
                      focusOption(event, 1);
                    } else if (event.key === "ArrowUp") {
                      if (event.currentTarget === selectRef.current?.querySelector('[role="option"]')) {
                        event.preventDefault();
                        searchRef.current?.focus();
                      } else {
                        focusOption(event, -1);
                      }
                    }
                  }}
                >
                  <span className="patient-select__avatar" aria-hidden="true">{patient.label.trim().charAt(0).toLocaleUpperCase()}</span>
                  <span className="patient-select__copy">
                    <strong>{patient.label.replace(/\s*\(démo\)$/i, "")}</strong>
                    <small>{getPatientDetails(patient)}</small>
                  </span>
                  {isDemo && <span className="patient-select__badge">Démo</span>}
                  {isSelected && <Check className="patient-select__check" size={16} aria-hidden="true" />}
                </button>
              );
            }) : (
              <p className="patient-select__empty" role="status">
                {options.length === 0 ? "Aucun patient enregistré." : "Aucun patient ne correspond à cette recherche."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PatientBirthDatePicker({ value, onChange, maxDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewedDate, setViewedDate] = useState(() => {
    const initialDate = value ? new Date(`${value}T00:00:00`) : new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const pickerRef = useRef(null);
  const today = new Date(`${maxDate}T00:00:00`);
  const currentYear = today.getFullYear();
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
  const monthLabel = new Intl.DateTimeFormat("fr-GN", { month: "long" }).format(viewedDate);
  const weekdays = Array.from({ length: 7 }, (_, index) => (
    new Intl.DateTimeFormat("fr-GN", { weekday: "short" }).format(new Date(2024, 0, index + 1))
  ));
  const firstWeekday = (new Date(viewedDate.getFullYear(), viewedDate.getMonth(), 1).getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) => (
    new Date(viewedDate.getFullYear(), viewedDate.getMonth(), index - firstWeekday + 1)
  ));
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const shiftMonth = (amount) => {
    setViewedDate((date) => new Date(date.getFullYear(), date.getMonth() + amount, 1));
  };

  return (
    <div className="birth-date-picker" ref={pickerRef}>
      <button
        className={`birth-date-picker__trigger${isOpen ? " birth-date-picker__trigger--open" : ""}`}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          if (!isOpen && selectedDate) setViewedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          setIsOpen((open) => !open);
        }}
      >
        <span className={value ? "" : "birth-date-picker__placeholder"}>
          {selectedDate
            ? new Intl.DateTimeFormat("fr-GN", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`))
            : "Choisir une date"}
        </span>
        <CalendarDays size={17} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="birth-date-calendar" role="dialog" aria-label="Choisir la date de naissance">
          <div className="birth-date-calendar__header">
            <button type="button" aria-label="Mois précédent" onClick={() => shiftMonth(-1)}><ArrowLeft size={15} /></button>
            <div className="birth-date-calendar__selectors">
              <select
                aria-label="Mois"
                value={viewedDate.getMonth()}
                onChange={(event) => setViewedDate(new Date(viewedDate.getFullYear(), Number(event.target.value), 1))}
              >
                {Array.from({ length: 12 }, (_, month) => (
                  <option value={month} key={month}>{new Intl.DateTimeFormat("fr-GN", { month: "long" }).format(new Date(2024, month, 1))}</option>
                ))}
              </select>
              <select
                aria-label="Année"
                value={viewedDate.getFullYear()}
                onChange={(event) => setViewedDate(new Date(Number(event.target.value), viewedDate.getMonth(), 1))}
              >
                {Array.from({ length: 131 }, (_, index) => currentYear - index).map((year) => (
                  <option value={year} key={year}>{year}</option>
                ))}
              </select>
            </div>
            <button type="button" aria-label="Mois suivant" disabled={viewedDate.getFullYear() === currentYear && viewedDate.getMonth() === today.getMonth()} onClick={() => shiftMonth(1)}><ArrowRight size={15} /></button>
          </div>
          <div className="birth-date-calendar__grid birth-date-calendar__weekdays" aria-hidden="true">
            {weekdays.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}
          </div>
          <div className="birth-date-calendar__grid">
            {days.map((date, index) => {
              const dateValue = formatDate(date);
              const outsideMonth = date.getMonth() !== viewedDate.getMonth();
              const isFuture = dateValue > maxDate;
              const isSelected = dateValue === value;
              const isToday = dateValue === maxDate;
              return (
                <button
                  className={[
                    "birth-date-calendar__day",
                    outsideMonth ? "birth-date-calendar__day--outside" : "",
                    isSelected ? "birth-date-calendar__day--selected" : "",
                    isToday && !isSelected ? "birth-date-calendar__day--today" : "",
                  ].filter(Boolean).join(" ")}
                  type="button"
                  key={`${dateValue}-${index}`}
                  disabled={isFuture}
                  aria-label={new Intl.DateTimeFormat("fr-GN", { dateStyle: "full" }).format(date)}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(dateValue);
                    setIsOpen(false);
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="birth-date-calendar__footer">
            <span>{value ? `Âge : ${getAgeFromBirthDate(value)} ans` : "La date de naissance détermine l’âge"}</span>
            <button type="button" onClick={() => setViewedDate(new Date(currentYear, today.getMonth(), 1))}>Aujourd’hui</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientsWorkspace({ user, onSignOut, isDemo = false }) {
  const [patients, setPatients] = useState(() => isDemo ? demoPatients : []);
  const [payments, setPayments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [form, setForm] = useState(emptyForm);
  const [paymentForm, setPaymentForm] = useState({
    patient_id: "",
    service: "",
    amount: "",
    insured: "false",
    status: "paid",
    practitioner: "",
    occurred_at: getLocalDateTimeValue(),
  });
  const [clinicalNoteForm, setClinicalNoteForm] = useState(emptyClinicalNoteForm);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [prescriptionPatientId, setPrescriptionPatientId] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState(emptyPrescriptionForm);
  const [paymentReturnToPatientId, setPaymentReturnToPatientId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isPrescriptionFormOpen, setIsPrescriptionFormOpen] = useState(false);
  const [isClinicalNoteFormOpen, setIsClinicalNoteFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(!isDemo);
  const [isPrescriptionsLoading, setIsPrescriptionsLoading] = useState(!isDemo);
  const [areClinicalNotesLoading, setAreClinicalNotesLoading] = useState(!isDemo);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [isPrescriptionSaving, setIsPrescriptionSaving] = useState(false);
  const [isClinicalNoteSaving, setIsClinicalNoteSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [prescriptionError, setPrescriptionError] = useState("");
  const [clinicalNoteError, setClinicalNoteError] = useState("");
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    const isDialogOpen = Boolean(
      selectedPatientId
      || isFormOpen
      || isPaymentFormOpen
      || isPrescriptionFormOpen
      || isClinicalNoteFormOpen
      || selectedInvoice,
    );
    if (!isDialogOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPatientId, isFormOpen, isPaymentFormOpen, isPrescriptionFormOpen, isClinicalNoteFormOpen, selectedInvoice]);

  const loadPatients = useCallback(async () => {
    if (isDemo) return;
    setError("");
    const { data, error: loadError } = await requireSupabase()
      .from("patients")
      .select("id, full_name, birth_date, age, contact, quartier, home_address, city, created_at")
      .order("created_at", { ascending: false });
    if (loadError) {
      setError(loadError.message);
      setIsLoading(false);
      return;
    }
    setPatients(data ?? []);
    setIsLoading(false);
  }, [isDemo]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const loadPayments = useCallback(async () => {
    if (isDemo) return;
    setPaymentError("");
    const { data, error: loadError } = await requireSupabase()
      .from("payments")
      .select("id, patient_id, patient_name, service, amount, insured, status, practitioner, occurred_at, created_at")
      .order("occurred_at", { ascending: false });
    if (loadError) {
      setPaymentError(loadError.message);
      setIsPaymentsLoading(false);
      return;
    }
    setPayments(data ?? []);
    setIsPaymentsLoading(false);
  }, [isDemo]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const loadPrescriptions = useCallback(async () => {
    if (isDemo) return;
    setPrescriptionError("");
    const { data, error: loadError } = await requireSupabase()
      .from("prescriptions")
      .select("id, patient_id, patient_name, medications, instructions, practitioner, issued_at, created_at")
      .order("issued_at", { ascending: false });
    if (loadError) {
      setPrescriptionError(loadError.message);
      setIsPrescriptionsLoading(false);
      return;
    }
    setPrescriptions(data ?? []);
    setIsPrescriptionsLoading(false);
  }, [isDemo]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const loadClinicalNotes = useCallback(async () => {
    if (isDemo) return;
    setClinicalNoteError("");
    const { data, error: loadError } = await requireSupabase()
      .from("clinical_notes")
      .select("id, patient_id, patient_name, title, content, practitioner, occurred_at, created_at")
      .order("occurred_at", { ascending: false });
    if (loadError) {
      setClinicalNoteError(loadError.message);
      setAreClinicalNotesLoading(false);
      return;
    }
    setClinicalNotes(data ?? []);
    setAreClinicalNotesLoading(false);
  }, [isDemo]);

  useEffect(() => {
    loadClinicalNotes();
  }, [loadClinicalNotes]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return patients;
    const phoneQuery = query.replace(/\D/g, "");
    return patients.filter((patient) => {
      const nameMatches = patient.full_name.toLocaleLowerCase().includes(query);
      const contactMatches = phoneQuery && (patient.contact ?? "").replace(/\D/g, "").includes(phoneQuery);
      return nameMatches || contactMatches;
    });
  }, [patients, search]);

  const filteredPayments = useMemo(() => {
    const query = paymentSearch.trim().toLocaleLowerCase();
    if (!query) return payments;
    return payments.filter((payment) => (
      payment.patient_name.toLocaleLowerCase().includes(query)
      || payment.service.toLocaleLowerCase().includes(query)
      || payment.practitioner.toLocaleLowerCase().includes(query)
      || payment.status.toLocaleLowerCase().includes(query)
    ));
  }, [payments, paymentSearch]);

  const dailyPaymentsTotal = useMemo(() => {
    const today = getLocalDateKey(new Date());
    return payments.reduce((total, payment) => (
      getLocalDateKey(new Date(payment.occurred_at)) === today ? total + Number(payment.amount) : total
    ), 0);
  }, [payments]);

  const todayClinicalNotes = useMemo(() => {
    const today = getLocalDateKey(new Date());
    return clinicalNotes.filter((note) => getLocalDateKey(new Date(note.occurred_at)) === today);
  }, [clinicalNotes]);
  const recentClinicalNotes = clinicalNotes.slice(0, 8);
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? null;
  const selectedPatientPayments = selectedPatient
    ? payments.filter((payment) => payment.patient_id === selectedPatient.id)
    : [];
  const selectedPatientPrescriptions = selectedPatient
    ? prescriptions.filter((prescription) => prescription.patient_id === selectedPatient.id)
    : [];
  const selectedPatientNotes = selectedPatient
    ? clinicalNotes.filter((note) => note.patient_id === selectedPatient.id)
    : [];

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPatientId(null);
    setForm(emptyForm);
  };

  const openPaymentForm = (patientId = patients[0]?.id ?? "", returnToPatient = false) => {
    setPaymentError("");
    setPaymentForm({
      patient_id: patientId,
      service: "",
      amount: "",
      insured: "false",
      status: "paid",
      practitioner: "",
      occurred_at: getLocalDateTimeValue(),
    });
    setPaymentReturnToPatientId(returnToPatient ? patientId : null);
    if (returnToPatient) setSelectedPatientId(null);
    setIsPaymentFormOpen(true);
  };

  const openPrescriptionForm = (patientId) => {
    setPrescriptionError("");
    setPrescriptionPatientId(patientId);
    setPrescriptionForm({
      ...emptyPrescriptionForm,
      medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
      issued_at: getLocalDateTimeValue(),
    });
    setSelectedPatientId(null);
    setIsPrescriptionFormOpen(true);
  };

  const openClinicalNoteForm = (patientId = "") => {
    setClinicalNoteError("");
    setClinicalNoteForm({ ...emptyClinicalNoteForm, patient_id: patientId, occurred_at: getLocalDateTimeValue() });
    setIsClinicalNoteFormOpen(true);
  };

  const closeClinicalNoteForm = () => {
    if (isClinicalNoteSaving) return;
    setIsClinicalNoteFormOpen(false);
    setClinicalNoteError("");
  };

  const saveClinicalNote = async (event) => {
    event.preventDefault();
    setClinicalNoteError("");
    const patient = patients.find((item) => item.id === clinicalNoteForm.patient_id);
    if (!patient) {
      setClinicalNoteError("Sélectionnez un patient enregistré avant de créer une consultation.");
      return;
    }
    const occurredAt = new Date(clinicalNoteForm.occurred_at);
    if (Number.isNaN(occurredAt.getTime())) {
      setClinicalNoteError("La date et l’heure saisies ne sont pas valides.");
      return;
    }
    const details = {
      patient_id: patient.id,
      patient_name: patient.full_name,
      title: clinicalNoteForm.title.trim(),
      content: clinicalNoteForm.content.trim(),
      practitioner: clinicalNoteForm.practitioner.trim(),
      occurred_at: occurredAt.toISOString(),
    };
    if (!details.title || !details.content || !details.practitioner) {
      setClinicalNoteError("Renseignez le motif, les observations et le nom du praticien.");
      return;
    }

    setIsClinicalNoteSaving(true);
    let savedNote;
    if (isDemo) {
      savedNote = { ...details, id: `demo-note-${Date.now()}`, created_at: new Date().toISOString() };
    } else {
      const { data, error: saveError } = await requireSupabase()
        .from("clinical_notes")
        .insert({ ...details, user_id: user.id })
        .select("id, patient_id, patient_name, title, content, practitioner, occurred_at, created_at")
        .single();
      if (saveError) {
        setClinicalNoteError(saveError.message);
        setIsClinicalNoteSaving(false);
        return;
      }
      savedNote = data;
    }
    setClinicalNotes((current) => [savedNote, ...current].sort((left, right) => (
      new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime()
    )));
    setIsClinicalNoteSaving(false);
    setIsClinicalNoteFormOpen(false);
    setActiveView("doctor");
    setClinicalNoteForm(emptyClinicalNoteForm);
  };

  const closePaymentForm = () => {
    setIsPaymentFormOpen(false);
    if (paymentReturnToPatientId) setSelectedPatientId(paymentReturnToPatientId);
    setPaymentReturnToPatientId(null);
  };

  const closePrescriptionForm = () => {
    setIsPrescriptionFormOpen(false);
    if (prescriptionPatientId) setSelectedPatientId(prescriptionPatientId);
    setPrescriptionPatientId(null);
    setPrescriptionError("");
  };

  const patientOptions = useMemo(() => [
    ...patients.map((patient) => ({
      id: patient.id,
      label: patient.full_name,
      contact: patient.contact,
      age: patient.age,
      city: patient.city,
    })),
  ], [patients]);

  const savePayment = async (event) => {
    event.preventDefault();
    setPaymentError("");
    const patient = patients.find((item) => item.id === paymentForm.patient_id);
    if (!patient) {
      setPaymentError("Sélectionnez un patient enregistré avant de créer le paiement.");
      return;
    }
    const amount = Number(paymentForm.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setPaymentError("Saisissez un montant entier supérieur à zéro, en GNF.");
      return;
    }
    const occurredAt = new Date(paymentForm.occurred_at);
    if (Number.isNaN(occurredAt.getTime())) {
      setPaymentError("La date et l’heure saisies ne sont pas valides.");
      return;
    }

    setIsPaymentSaving(true);
    const details = {
      patient_id: patient.id,
      patient_name: patient.full_name,
      service: paymentForm.service,
      amount,
      insured: paymentForm.insured === "true",
      status: paymentForm.status,
      practitioner: paymentForm.practitioner.trim(),
      occurred_at: occurredAt.toISOString(),
    };
    let savedPayment;
    if (isDemo) {
      savedPayment = { ...details, id: `demo-payment-${Date.now()}`, created_at: new Date().toISOString() };
    } else {
      const { data, error: saveError } = await requireSupabase()
        .from("payments")
        .insert({ ...details, user_id: user.id })
        .select("id, patient_id, patient_name, service, amount, insured, status, practitioner, occurred_at, created_at")
        .single();
      if (saveError) {
        setPaymentError(saveError.message);
        setIsPaymentSaving(false);
        return;
      }
      savedPayment = data;
    }

    setPayments((current) => [savedPayment, ...current]);
    const returnToPatientId = paymentReturnToPatientId;
    setIsPaymentSaving(false);
    setIsPaymentFormOpen(false);
    setPaymentReturnToPatientId(null);
    setPaymentForm((current) => ({ ...current, service: "", amount: "", practitioner: "" }));
    if (returnToPatientId) setSelectedPatientId(returnToPatientId);
  };

  const savePrescription = async (event) => {
    event.preventDefault();
    setPrescriptionError("");
    const patient = patients.find((item) => item.id === prescriptionPatientId);
    if (!patient) {
      setPrescriptionError("Le patient sélectionné est introuvable. Fermez le formulaire et réessayez.");
      return;
    }
    const medications = prescriptionForm.medications.map((medication) => ({
      name: medication.name.trim(),
      dosage: medication.dosage.trim(),
      frequency: medication.frequency.trim(),
      duration: medication.duration.trim(),
    }));
    if (medications.some((medication) => !medication.name || !medication.dosage || !medication.frequency || !medication.duration)) {
      setPrescriptionError("Complétez le nom, la posologie, la fréquence et la durée de chaque médicament.");
      return;
    }
    const issuedAt = new Date(prescriptionForm.issued_at);
    if (Number.isNaN(issuedAt.getTime())) {
      setPrescriptionError("La date de l’ordonnance n’est pas valide.");
      return;
    }

    setIsPrescriptionSaving(true);
    const details = {
      patient_id: patient.id,
      patient_name: patient.full_name,
      medications,
      instructions: prescriptionForm.instructions.trim(),
      practitioner: prescriptionForm.practitioner.trim(),
      issued_at: issuedAt.toISOString(),
    };
    let savedPrescription;
    if (isDemo) {
      savedPrescription = { ...details, id: `demo-prescription-${Date.now()}`, created_at: new Date().toISOString() };
    } else {
      const { data, error: saveError } = await requireSupabase()
        .from("prescriptions")
        .insert({ ...details, user_id: user.id })
        .select("id, patient_id, patient_name, medications, instructions, practitioner, issued_at, created_at")
        .single();
      if (saveError) {
        setPrescriptionError(saveError.message);
        setIsPrescriptionSaving(false);
        return;
      }
      savedPrescription = data;
    }
    setPrescriptions((current) => [savedPrescription, ...current]);
    setIsPrescriptionSaving(false);
    setIsPrescriptionFormOpen(false);
    setSelectedPatientId(patient.id);
    setPrescriptionPatientId(null);
  };

  const printInvoice = (payment) => {
    setSelectedInvoice(payment);
  };

  const openNewPatientForm = () => {
    setError("");
    setEditingPatientId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const editPatient = (patient) => {
    setError("");
    setEditingPatientId(patient.id);
    setForm({
      ...splitPatientName(patient.full_name),
      birth_date: patient.birth_date ?? "",
      age: patient.age?.toString() ?? "",
      contact: getGuineaNationalNumber(patient.contact ?? ""),
      quartier: patient.quartier ?? "",
      home_address: patient.home_address ?? "",
      city: patient.city ?? "",
    });
    setSelectedPatientId(null);
    setIsFormOpen(true);
  };

  const savePatient = async (event) => {
    event.preventDefault();
    setError("");
    const calculatedAge = getAgeFromBirthDate(form.birth_date);
    if (form.birth_date && (calculatedAge < 0 || calculatedAge > 130)) {
      setError("La date de naissance doit correspondre à un âge compris entre 0 et 130 ans.");
      return;
    }
    if (!form.birth_date && !editingPatientId) {
      setError("Renseignez la date de naissance pour calculer l’âge du patient.");
      return;
    }
    setIsSaving(true);
    const details = {
      full_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
      birth_date: form.birth_date || null,
      age: form.birth_date ? calculatedAge : Number(form.age),
      contact: `+224 ${getGuineaNationalNumber(form.contact).trim()}`,
      quartier: form.quartier.trim(),
      home_address: editingPatientId
        ? patients.find((patient) => patient.id === editingPatientId)?.home_address ?? ""
        : "",
      city: form.city.trim(),
    };

    let data;
    if (isDemo) {
      data = {
        ...details,
        id: editingPatientId ?? `demo-patient-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
    } else {
      const query = requireSupabase().from("patients");
      const { data: savedPatient, error: saveError } = editingPatientId
        ? await query.update(details).eq("id", editingPatientId).select("id, full_name, birth_date, age, contact, quartier, home_address, city, created_at").single()
        : await query.insert({ ...details, user_id: user.id }).select("id, full_name, birth_date, age, contact, quartier, home_address, city, created_at").single();

      if (saveError) {
        setError(saveError.message);
        setIsSaving(false);
        return;
      }
      data = savedPatient;
    }
    setPatients((current) => editingPatientId
      ? current.map((patient) => patient.id === editingPatientId ? data : patient)
      : [data, ...current]);
    if (!editingPatientId) setActiveView("patients");
    setSelectedPatientId(data.id);
    setIsSaving(false);
    closeForm();
  };

  const deletePatient = async (patient) => {
    if (!window.confirm(`Supprimer la fiche de ${patient.full_name} ? Cette action est définitive.`)) return;
    setError("");
    if (!isDemo) {
      const { error: deleteError } = await requireSupabase()
        .from("patients")
        .delete()
        .eq("id", patient.id);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
    }
    setPatients((current) => current.filter((item) => item.id !== patient.id));
  };

  const handleSignOut = async () => {
    setSignOutError("");
    setIsSigningOut(true);
    try {
      await onSignOut();
    } catch (signOutRequestError) {
      setSignOutError(signOutRequestError.message);
      setIsSigningOut(false);
    }
  };

  return (
    <main className="patients-workspace">
      <header className="patients-topbar">
        <a className="patients-brand" href="#accueil" aria-label="Clinic DC, accueil">
          <span className="patients-brand__mark"><UsersRound size={19} /></span>
          <span>Clinic <b>DC</b></span>
        </a>
        <div className="patients-account">
          <span className="patients-account__identity">{user.email}</span>
          <button className="patients-signout" type="button" disabled={isSigningOut} onClick={handleSignOut}>
            <LogOut size={16} /> {isSigningOut ? "Déconnexion…" : "Déconnexion"}
          </button>
        </div>
      </header>

      <section className="patients-content">
        {isDemo && (
          <div className="patients-demo-banner" role="status">
            <strong>Espace administrateur · démo</strong>
            <span>Données fictives — aucune modification ne sera enregistrée dans Supabase.</span>
            <button type="button" onClick={onSignOut}>Quitter l’aperçu</button>
          </div>
        )}
        <nav className="workspace-nav" aria-label="Navigation de l’espace de travail">
          <button className={activeView === "dashboard" ? "workspace-nav__item workspace-nav__item--active" : "workspace-nav__item"} type="button" onClick={() => setActiveView("dashboard")}>
            <LayoutDashboard size={16} /> Tableau de bord
          </button>
          <button className={activeView === "doctor" ? "workspace-nav__item workspace-nav__item--active" : "workspace-nav__item"} type="button" onClick={() => setActiveView("doctor")}>
            <Stethoscope size={16} /> Espace médecin
          </button>
          <button className={activeView === "patients" ? "workspace-nav__item workspace-nav__item--active" : "workspace-nav__item"} type="button" onClick={() => setActiveView("patients")}>
            <UsersRound size={16} /> Patients <span>{patients.length}</span>
          </button>
          <button className={activeView === "payments" ? "workspace-nav__item workspace-nav__item--active" : "workspace-nav__item"} type="button" onClick={() => setActiveView("payments")}>
            <Wallet size={16} /> Paiements <span>{payments.length}</span>
          </button>
        </nav>

        {activeView === "dashboard" ? (
          <>
            <div className="patients-heading">
              <div>
                <span className="eyebrow">VUE D’ENSEMBLE</span>
                <h1>Bonjour, {getDisplayName(user)}.</h1>
                <p>Voici les informations disponibles dans votre espace Clinic DC.</p>
              </div>
            </div>

            <section className="daily-total" aria-label="Total des encaissements du jour">
              <div className="daily-total__details">
                <span className="daily-total__icon"><Wallet size={21} /></span>
                <div>
                  <span className="daily-total__eyebrow">SUIVI FINANCIER · AUJOURD’HUI</span>
                  <h2>Total du jour</h2>
                  <p>{isPaymentsLoading ? "Chargement des encaissements…" : payments.length ? "Total des montants encaissés aujourd’hui." : "Aucun paiement enregistré pour aujourd’hui."}</p>
                </div>
              </div>
              <div className="daily-total__amount">
                <strong>{isPaymentsLoading ? "…" : formatAmount(dailyPaymentsTotal)}</strong>
                <span>GNF</span>
                <small><CalendarDays size={13} /> {new Intl.DateTimeFormat("fr-GN", { dateStyle: "full" }).format(new Date())}</small>
              </div>
            </section>

            <div className="dashboard-metrics">
              <article className="dashboard-metric">
                <span className="dashboard-metric__icon"><UsersRound size={19} /></span>
                <span className="dashboard-metric__label">Patients enregistrés</span>
                <strong>{isLoading ? "…" : patients.length}</strong>
                <button type="button" onClick={() => setActiveView("patients")}>Ouvrir le répertoire <ArrowRight size={14} /></button>
              </article>
              <article className="dashboard-metric dashboard-metric--muted">
                <span className="dashboard-metric__icon"><CalendarDays size={19} /></span>
                <span className="dashboard-metric__label">Rendez-vous</span>
                <strong>À venir</strong>
                <small>Le module agenda sera ajouté ensuite.</small>
              </article>
              <article className="dashboard-metric dashboard-metric--muted">
                <span className="dashboard-metric__icon"><Activity size={19} /></span>
                <span className="dashboard-metric__label">Activité clinique</span>
                <strong>À venir</strong>
                <small>Les ordonnances sont accessibles depuis chaque fiche patient.</small>
              </article>
            </div>

          </>
        ) : activeView === "patients" ? (
          <>
            <div className="patients-heading">
              <div>
                <span className="eyebrow">RÉPERTOIRE</span>
                <h1>Patients.</h1>
                <p>Gérez les coordonnées de vos patients.</p>
              </div>
              <button className="button button--primary patients-add" type="button" onClick={openNewPatientForm}>
                <span className="new-patient-icon" aria-hidden="true"><UsersRound size={18} /><span><Plus size={10} /></span></span>
                Nouveau patient
              </button>
            </div>

            <div className="patients-summary">
              <div className="patients-summary__icon"><UsersRound size={19} /></div>
              <div><span>Patients enregistrés</span><strong>{patients.length}</strong></div>
              <span className="patients-summary__note">Données de votre compte</span>
            </div>

            <section className="patients-list-card" aria-labelledby="patients-list-heading">
              <div className="patients-list-heading">
                <div><h2 id="patients-list-heading">Répertoire des patients</h2><p>Sélectionnez un nom pour ouvrir sa fiche et ses actions</p></div>
                <label className="patients-search">
                  <Search size={16} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par nom ou contact" aria-label="Rechercher un patient par nom ou contact" />
                </label>
              </div>

              {isLoading ? (
                <p className="patients-empty">Chargement du répertoire…</p>
              ) : filteredPatients.length === 0 ? (
                <div className="patients-empty">
                  <span className="patients-empty__icon"><UsersRound size={22} /></span>
                  <strong>{search ? "Aucun résultat trouvé" : "Votre répertoire est vide"}</strong>
                  <span>{search ? "Essayez un autre nom ou une autre coordonnée." : "Ajoutez votre premier patient pour commencer."}</span>
                </div>
              ) : (
                <div className="patients-directory-list">
                  {filteredPatients.map((patient) => (
                    <article className="patients-directory-row" key={patient.id} onClick={() => setSelectedPatientId(patient.id)}>
                      <span className="patients-avatar" aria-hidden="true">{patient.full_name.trim().charAt(0).toUpperCase()}</span>
                      <div className="patients-directory-identity">
                        <button className="patient-name-link" type="button" onClick={() => setSelectedPatientId(patient.id)} aria-label={`Ouvrir la fiche de ${patient.full_name}`}>{patient.full_name}</button>
                        <span>{patient.age == null ? "Âge non renseigné" : `${patient.age} ans`}</span>
                      </div>
                      <div className="patients-directory-details">
                        <span><small>Contact</small><span>{patient.contact || "—"}</span></span>
                        <span><small>Localisation</small><span>{[patient.quartier, patient.city].filter(Boolean).join(", ") || "—"}</span></span>
                      </div>
                      <div className="patients-row-actions">
                        <button type="button" aria-label={`Modifier ${patient.full_name}`} onClick={(event) => { event.stopPropagation(); editPatient(patient); }}><Pencil size={15} /></button>
                        <button type="button" aria-label={`Supprimer ${patient.full_name}`} onClick={(event) => { event.stopPropagation(); deletePatient(patient); }}><Trash2 size={15} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <p className="patients-privacy"><Mail size={14} /> Les ordonnances sont conservées dans la fiche du patient et restent propres à votre établissement.</p>
          </>
        ) : activeView === "doctor" ? (
          <>
            <div className="patients-heading">
              <div>
                <span className="eyebrow">SUIVI DES SOINS</span>
                <h1>Espace médecin.</h1>
                <p>Retrouvez les consultations, dossiers patients, ordonnances et notes médicales.</p>
              </div>
              <button className="button button--primary patients-add" type="button" onClick={() => openClinicalNoteForm()} disabled={patients.length === 0}>
                <Plus size={17} /> Nouvelle consultation
              </button>
            </div>
            {clinicalNoteError && !isClinicalNoteFormOpen && <p className="patients-error" role="alert">{clinicalNoteError}</p>}

            <div className="dashboard-metrics doctor-metrics">
              <article className="dashboard-metric">
                <span className="dashboard-metric__icon"><Stethoscope size={19} /></span>
                <span className="dashboard-metric__label">Consultations aujourd’hui</span>
                <strong>{areClinicalNotesLoading ? "…" : todayClinicalNotes.length}</strong>
                <small>À partir des notes de consultation enregistrées</small>
              </article>
              <article className="dashboard-metric">
                <span className="dashboard-metric__icon"><UsersRound size={19} /></span>
                <span className="dashboard-metric__label">Dossiers patients</span>
                <strong>{isLoading ? "…" : patients.length}</strong>
                <button type="button" onClick={() => setActiveView("patients")}>Ouvrir le répertoire <ArrowRight size={14} /></button>
              </article>
              <article className="dashboard-metric">
                <span className="dashboard-metric__icon"><ClipboardList size={19} /></span>
                <span className="dashboard-metric__label">Ordonnances</span>
                <strong>{isPrescriptionsLoading ? "…" : prescriptions.length}</strong>
                <small>Historisées dans les dossiers patients</small>
              </article>
            </div>

            <div className="doctor-panels">
              <section className="patients-list-card doctor-panel" aria-labelledby="doctor-patients-heading">
                <div className="patients-list-heading">
                  <div><h2 id="doctor-patients-heading">Dossiers patients</h2><p>Accédez à une fiche ou commencez une consultation.</p></div>
                  <button className="doctor-panel-link" type="button" onClick={() => setActiveView("patients")}>Tout voir <ArrowRight size={14} /></button>
                </div>
                {isLoading ? <p className="patients-empty">Chargement du répertoire…</p> : patients.length === 0 ? (
                  <div className="patients-empty">
                    <strong>Aucun dossier patient</strong>
                    <span>Ajoutez un patient pour commencer le suivi médical.</span>
                    <button className="dashboard-view-all" type="button" onClick={openNewPatientForm}><Plus size={14} /> Nouveau patient</button>
                  </div>
                ) : (
                  <div className="doctor-patient-list">
                    {patients.slice(0, 6).map((patient) => (
                      <article className="doctor-patient-row" key={patient.id}>
                        <span className="patients-avatar">{patient.full_name.trim().charAt(0).toUpperCase()}</span>
                        <div><strong>{patient.full_name}</strong><span>{patient.age == null ? "Âge non renseigné" : `${patient.age} ans`} · {patient.city || "Ville non renseignée"}</span></div>
                        <button type="button" onClick={() => setSelectedPatientId(patient.id)}>Dossier</button>
                        <button type="button" aria-label={`Nouvelle consultation pour ${patient.full_name}`} onClick={() => openClinicalNoteForm(patient.id)}><Plus size={15} /></button>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="patients-list-card doctor-panel" aria-labelledby="doctor-today-heading">
                <div className="patients-list-heading">
                  <div><h2 id="doctor-today-heading">Consultations du jour</h2><p>Les consultations sont créées depuis une note médicale.</p></div>
                  <span className="doctor-count">{todayClinicalNotes.length}</span>
                </div>
                {areClinicalNotesLoading ? <p className="patients-empty">Chargement des consultations…</p> : todayClinicalNotes.length === 0 ? (
                  <div className="patients-empty">
                    <span className="patients-empty__icon"><Stethoscope size={22} /></span>
                    <strong>Aucune consultation aujourd’hui</strong>
                    <span>Les consultations enregistrées apparaîtront ici.</span>
                    {patients.length > 0 && <button className="dashboard-view-all" type="button" onClick={() => openClinicalNoteForm()}><Plus size={14} /> Enregistrer une consultation</button>}
                  </div>
                ) : (
                  <div className="doctor-note-list">
                    {todayClinicalNotes.map((note) => (
                      <article className="doctor-note-row" key={note.id}>
                        <span>{new Intl.DateTimeFormat("fr-GN", { timeStyle: "short" }).format(new Date(note.occurred_at))}</span>
                        <div><strong>{note.title}</strong><button type="button" onClick={() => setSelectedPatientId(note.patient_id)}>{note.patient_name}</button><p>{note.content}</p><small>{note.practitioner}</small></div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="patients-list-card doctor-panel" aria-labelledby="doctor-notes-heading">
                <div className="patients-list-heading">
                  <div><h2 id="doctor-notes-heading">Notes médicales récentes</h2><p>Observations consignées dans les dossiers.</p></div>
                </div>
                {areClinicalNotesLoading ? <p className="patients-empty">Chargement des notes…</p> : recentClinicalNotes.length === 0 ? (
                  <div className="patients-empty"><strong>Aucune note médicale</strong><span>Créez une consultation pour ajouter la première note.</span></div>
                ) : (
                  <div className="doctor-note-list">
                    {recentClinicalNotes.map((note) => (
                      <article className="doctor-note-row" key={note.id}>
                        <span>{new Intl.DateTimeFormat("fr-GN", { dateStyle: "medium" }).format(new Date(note.occurred_at))}</span>
                        <div><strong>{note.title}</strong><button type="button" onClick={() => setSelectedPatientId(note.patient_id)}>{note.patient_name}</button><p>{note.content}</p><small>{note.practitioner}</small></div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="patients-list-card doctor-panel" aria-labelledby="doctor-prescriptions-heading">
                <div className="patients-list-heading">
                  <div><h2 id="doctor-prescriptions-heading">Ordonnances récentes</h2><p>Consultez-les depuis la fiche de chaque patient.</p></div>
                </div>
                {isPrescriptionsLoading ? <p className="patients-empty">Chargement des ordonnances…</p> : prescriptions.length === 0 ? (
                  <div className="patients-empty"><strong>Aucune ordonnance enregistrée</strong><span>Les ordonnances créées dans un dossier patient apparaîtront ici.</span></div>
                ) : (
                  <div className="doctor-note-list">
                    {prescriptions.slice(0, 6).map((prescription) => (
                      <article className="doctor-note-row" key={prescription.id}>
                        <span>{new Intl.DateTimeFormat("fr-GN", { dateStyle: "medium" }).format(new Date(prescription.issued_at))}</span>
                        <div><strong>{prescription.patient_name}</strong><button type="button" onClick={() => setSelectedPatientId(prescription.patient_id)}>Ouvrir le dossier</button><p>{(prescription.medications ?? []).map((medication) => medication.name).join(", ")}</p><small>Dr {prescription.practitioner}</small></div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <>
            <div className="patients-heading">
              <div>
                <span className="eyebrow">GESTION FINANCIÈRE</span>
                <h1>Paiements.</h1>
                <p>Enregistrez les règlements et retrouvez les reçus de vos prestations.</p>
              </div>
              <button className="button button--primary patients-add" type="button" onClick={openPaymentForm} disabled={patients.length === 0}>
                <Plus size={17} /> Nouveau paiement
              </button>
            </div>

            {paymentError && <p className="patients-error" role="alert">{paymentError}</p>}

            <div className="payments-summary">
              <span className="payments-summary__icon"><CircleDollarSign size={20} /></span>
              <div><span>Encaissé aujourd’hui</span><strong>{isPaymentsLoading ? "…" : `${formatAmount(dailyPaymentsTotal)} GNF`}</strong></div>
              <span className="payments-summary__divider" />
              <div><span>Transactions enregistrées</span><strong>{isPaymentsLoading ? "…" : payments.length}</strong></div>
              <span className="patients-summary__note">Tous les montants sont exprimés en GNF</span>
            </div>

            <section className="patients-list-card payments-list-card" aria-labelledby="payments-list-heading">
              <div className="patients-list-heading">
                <div><h2 id="payments-list-heading">Historique des transactions</h2><p>Consultez et imprimez les factures de chaque règlement</p></div>
                <label className="patients-search">
                  <Search size={16} />
                  <input value={paymentSearch} onChange={(event) => setPaymentSearch(event.target.value)} placeholder="Patient, prestation ou praticien" aria-label="Rechercher une transaction" />
                </label>
              </div>

              {isPaymentsLoading ? (
                <p className="patients-empty">Chargement de l’historique…</p>
              ) : filteredPayments.length === 0 ? (
                <div className="patients-empty">
                  <span className="patients-empty__icon"><ClipboardList size={22} /></span>
                  <strong>{paymentSearch ? "Aucune transaction trouvée" : "Aucun paiement enregistré"}</strong>
                  <span>{paymentSearch ? "Essayez un autre nom, une prestation ou un praticien." : "Les paiements enregistrés apparaîtront ici avec leur facture imprimable."}</span>
                  {!paymentSearch && patients.length > 0 && <button className="dashboard-view-all" type="button" onClick={openPaymentForm}><Plus size={14} /> Enregistrer un paiement</button>}
                  {!paymentSearch && patients.length === 0 && <span>Ajoutez d’abord un patient dans le répertoire pour pouvoir créer un paiement.</span>}
                </div>
              ) : (
                <div className="patients-table-wrap">
                  <table className="patients-table payments-table">
                    <thead><tr><th>Date / heure</th><th>Patient</th><th>Prestation</th><th>Montant encaissé</th><th>Assurance</th><th>Statut</th><th>Praticien</th><th>Facture</th></tr></thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{new Intl.DateTimeFormat("fr-GN", { dateStyle: "short", timeStyle: "short" }).format(new Date(payment.occurred_at))}</td>
                          <td><strong>{payment.patient_name}</strong></td>
                          <td>{payment.service}</td>
                          <td className="payments-table__amount">{formatAmount(payment.amount)} GNF</td>
                          <td><span className={payment.insured ? "payment-tag payment-tag--insured" : "payment-tag"}>{payment.insured ? "Assuré(e)" : "Non assuré(e)"}</span></td>
                          <td><span className={payment.status === "partial" ? "payment-tag payment-tag--partial" : "payment-tag payment-tag--paid"}>{payment.status === "partial" ? "Partiel" : "Payé"}</span></td>
                          <td>{payment.practitioner}</td>
                          <td className="patients-row-actions"><button type="button" aria-label={`Imprimer la facture de ${payment.patient_name}`} onClick={() => printInvoice(payment)}><Printer size={15} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {error && <p className="patients-error" role="alert">{error}</p>}
        {paymentError && activeView !== "payments" && <p className="patients-error" role="alert">{paymentError}</p>}
        {prescriptionError && !isPrescriptionFormOpen && <p className="patients-error" role="alert">{prescriptionError}</p>}
        {clinicalNoteError && !isClinicalNoteFormOpen && activeView !== "doctor" && !selectedPatient && <p className="patients-error" role="alert">{clinicalNoteError}</p>}
        {signOutError && <p className="patients-error" role="alert">{signOutError}</p>}
      </section>

      {selectedPatient && (
        <div className="patients-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPatientId(null); }}>
          <section className="patients-form-card patient-record-card" role="dialog" aria-modal="true" aria-labelledby="patient-record-title">
            <button className="patients-form-close" type="button" aria-label="Fermer la fiche patient" onClick={() => setSelectedPatientId(null)}><X size={18} /></button>
            <span className="eyebrow">FICHE PATIENT</span>
            <div className="patient-record-heading">
              <span className="patients-avatar">{selectedPatient.full_name.trim().charAt(0).toUpperCase()}</span>
              <div>
                <h2 id="patient-record-title">{selectedPatient.full_name}</h2>
                <p>{selectedPatient.birth_date ? `${getAgeFromBirthDate(selectedPatient.birth_date)} ans` : selectedPatient.age == null ? "Âge non renseigné" : `${selectedPatient.age} ans`} · Patient depuis {new Intl.DateTimeFormat("fr-GN", { dateStyle: "medium" }).format(new Date(selectedPatient.created_at))}</p>
              </div>
            </div>
            <div className="patient-record-actions">
              <button className="button button--primary" type="button" onClick={() => openPaymentForm(selectedPatient.id, true)}><Wallet size={15} /> Nouveau paiement</button>
              <button className="patient-action-secondary" type="button" onClick={() => openClinicalNoteForm(selectedPatient.id)}><Stethoscope size={15} /> Nouvelle consultation</button>
              <button className="patient-action-secondary" type="button" onClick={() => openPrescriptionForm(selectedPatient.id)}><ClipboardList size={15} /> Créer une ordonnance</button>
              <button className="patient-action-secondary" type="button" onClick={() => editPatient(selectedPatient)}><Pencil size={15} /> Modifier les informations</button>
            </div>
            <section className="patient-record-section" aria-labelledby="patient-contact-heading">
              <h3 id="patient-contact-heading">Informations du patient</h3>
              <dl className="patient-record-details">
                <div><dt>Date de naissance</dt><dd>{selectedPatient.birth_date ? new Intl.DateTimeFormat("fr-GN", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${selectedPatient.birth_date}T00:00:00Z`)) : "Non renseignée"}</dd></div>
                <div><dt>Âge</dt><dd>{selectedPatient.birth_date ? `${getAgeFromBirthDate(selectedPatient.birth_date)} ans` : selectedPatient.age == null ? "Non renseigné" : `${selectedPatient.age} ans`}</dd></div>
                <div><dt>Catégorie d’âge</dt><dd>{getPatientAgeGroup(selectedPatient.birth_date ? getAgeFromBirthDate(selectedPatient.birth_date) : selectedPatient.age) || "Non déterminée"}</dd></div>
                <div><dt>Téléphone</dt><dd>{selectedPatient.contact || "Non renseigné"}</dd></div>
                <div><dt>Ville</dt><dd>{selectedPatient.city || "Non renseignée"}</dd></div>
                <div><dt>Quartier</dt><dd>{selectedPatient.quartier || "Non renseigné"}</dd></div>
              </dl>
            </section>
            <section className="patient-record-section" aria-labelledby="patient-notes-heading">
              <div className="patient-record-section__heading"><h3 id="patient-notes-heading">Notes médicales</h3><span>{selectedPatientNotes.length}</span></div>
              {clinicalNoteError && <p className="patients-error" role="alert">{clinicalNoteError}</p>}
              {areClinicalNotesLoading ? <p className="patient-record-empty">Chargement des notes médicales…</p>
                : selectedPatientNotes.length === 0 ? <p className="patient-record-empty">Aucune note médicale enregistrée pour ce patient.</p>
                  : selectedPatientNotes.map((note) => (
                    <article className="patient-history-card" key={note.id}>
                      <div className="patient-history-card__meta"><strong>{note.title}</strong><span>{new Intl.DateTimeFormat("fr-GN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(note.occurred_at))}</span></div>
                      <p>{note.content}</p>
                      <div className="doctor-note-practitioner">{note.practitioner}</div>
                    </article>
                  ))}
            </section>
            <section className="patient-record-section" aria-labelledby="patient-prescriptions-heading">
              <div className="patient-record-section__heading"><h3 id="patient-prescriptions-heading">Ordonnances</h3><span>{selectedPatientPrescriptions.length}</span></div>
              {prescriptionError && <p className="patients-error" role="alert">{prescriptionError}</p>}
              {isPrescriptionsLoading ? <p className="patient-record-empty">Chargement des ordonnances…</p>
                : selectedPatientPrescriptions.length === 0 ? <p className="patient-record-empty">Aucune ordonnance enregistrée pour ce patient.</p>
                  : selectedPatientPrescriptions.map((prescription) => (
                    <article className="patient-history-card" key={prescription.id}>
                      <div className="patient-history-card__meta"><strong>{new Intl.DateTimeFormat("fr-GN", { dateStyle: "medium" }).format(new Date(prescription.issued_at))}</strong><span>Dr {prescription.practitioner}</span></div>
                      <ul>{(prescription.medications ?? []).map((medication, index) => <li key={`${prescription.id}-${index}`}><strong>{medication.name}</strong><span>{medication.dosage} · {medication.frequency} · {medication.duration}</span></li>)}</ul>
                      {prescription.instructions && <p>{prescription.instructions}</p>}
                    </article>
                  ))}
            </section>
            <section className="patient-record-section" aria-labelledby="patient-payments-heading">
              <div className="patient-record-section__heading"><h3 id="patient-payments-heading">Paiements récents</h3><span>{selectedPatientPayments.length}</span></div>
              {selectedPatientPayments.length === 0 ? <p className="patient-record-empty">Aucun paiement enregistré pour ce patient.</p>
                : selectedPatientPayments.slice(0, 5).map((payment) => (
                  <div className="patient-payment-row" key={payment.id}>
                    <div><strong>{payment.service}</strong><span>{new Intl.DateTimeFormat("fr-GN", { dateStyle: "medium" }).format(new Date(payment.occurred_at))}</span></div>
                    <strong>{formatAmount(payment.amount)} GNF</strong>
                  </div>
                ))}
            </section>
            <div className="patient-record-footer"><ShieldCheck size={14} /> Les informations médicales sont réservées aux membres autorisés de l’établissement.</div>
          </section>
        </div>
      )}

      {isFormOpen && (
        <div className="patients-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <section className="patients-form-card patient-edit-form-card" role="dialog" aria-modal="true" aria-labelledby="patient-form-title">
            <button className="patients-form-close" type="button" aria-label="Fermer" onClick={closeForm}><X size={18} /></button>
            <span className="eyebrow">{editingPatientId ? "MISE À JOUR" : "NOUVEAU DOSSIER"}</span>
            <h2 id="patient-form-title">{editingPatientId ? "Modifier le patient." : "Ajouter un patient."}</h2>
            <p>Renseignez uniquement ses coordonnées administratives.</p>
            <form className="signup-form patient-form" onSubmit={savePatient}>
              <div className="patient-form-columns">
                <div className="patient-form-column">
                  <label>Prénom<input autoComplete="given-name" value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} maxLength={100} required /></label>
                  <label>Contact (téléphone)
                    <span className="patient-phone-input">
                      <span aria-hidden="true">+224</span>
                      <input autoComplete="tel-national" type="tel" inputMode="tel" value={form.contact} onChange={(event) => setForm({ ...form, contact: getGuineaNationalNumber(event.target.value) })} maxLength={32} placeholder="620 00 00 00" required />
                    </span>
                  </label>
                  <label>Quartier<input autoComplete="address-level3" value={form.quartier} onChange={(event) => setForm({ ...form, quartier: event.target.value })} maxLength={120} /></label>
                  <label>Ville<input autoComplete="address-level2" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} maxLength={100} required /></label>
                </div>
                <div className="patient-form-column">
                  <label>Nom<input autoComplete="family-name" value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} maxLength={100} required /></label>
                  <label>Date de naissance
                    <PatientBirthDatePicker
                      value={form.birth_date}
                      maxDate={getLocalDateKey(new Date())}
                      onChange={(birthDate) => setForm({
                        ...form,
                        birth_date: birthDate,
                        age: String(getAgeFromBirthDate(birthDate)),
                      })}
                    />
                  </label>
                  <label>Âge<input type="number" inputMode="numeric" min="0" max="130" value={form.birth_date ? getAgeFromBirthDate(form.birth_date) : form.age} readOnly aria-describedby="patient-age-help" placeholder={form.birth_date ? "" : "Renseignez la date de naissance"} /></label>
                  <label>Catégorie d’âge<input type="text" value={getPatientAgeGroup(form.birth_date ? getAgeFromBirthDate(form.birth_date) : form.age)} readOnly placeholder="Déterminée selon l’âge" /></label>
                </div>
              </div>
              <p className="patient-age-help" id="patient-age-help">L’âge est calculé automatiquement à partir de la date de naissance.</p>
              {error && <p className="patients-error" role="alert">{error}</p>}
              <div className="patients-form-actions">
                <button className="patients-cancel" type="button" onClick={closeForm}>Annuler</button>
                <button className="button button--primary" type="submit" disabled={isSaving}>{isSaving ? "Enregistrement…" : editingPatientId ? "Enregistrer" : "Ajouter le patient"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isPrescriptionFormOpen && (
        <div className="patients-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPrescriptionSaving) closePrescriptionForm(); }}>
          <section className="patients-form-card prescription-form-card" role="dialog" aria-modal="true" aria-labelledby="prescription-form-title">
            <button className="patients-form-close" type="button" aria-label="Fermer" disabled={isPrescriptionSaving} onClick={closePrescriptionForm}><X size={18} /></button>
            <span className="eyebrow">PRESCRIPTION MÉDICALE</span>
            <h2 id="prescription-form-title">Nouvelle ordonnance.</h2>
            <p>Patient : <strong>{patients.find((patient) => patient.id === prescriptionPatientId)?.full_name}</strong>. Renseignez les médicaments et les consignes de prescription.</p>
            <form className="signup-form" onSubmit={savePrescription}>
              <div className="prescription-medicines-heading"><strong>Médicaments</strong><button className="patient-action-secondary" type="button" onClick={() => setPrescriptionForm((current) => ({ ...current, medications: [...current.medications, { name: "", dosage: "", frequency: "", duration: "" }] }))}><Plus size={14} /> Ajouter un médicament</button></div>
              {prescriptionForm.medications.map((medication, index) => (
                <fieldset className="prescription-medicine" key={index}>
                  <legend>Médicament {index + 1}</legend>
                  {prescriptionForm.medications.length > 1 && <button className="prescription-medicine-remove" type="button" aria-label={`Retirer le médicament ${index + 1}`} onClick={() => setPrescriptionForm((current) => ({ ...current, medications: current.medications.filter((_, itemIndex) => itemIndex !== index) }))}><X size={14} /></button>}
                  <div className="prescription-medicine-fields">
                    <label>Nom du médicament<input value={medication.name} onChange={(event) => setPrescriptionForm((current) => ({ ...current, medications: current.medications.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} maxLength={160} required /></label>
                    <label>Dosage / posologie<input value={medication.dosage} onChange={(event) => setPrescriptionForm((current) => ({ ...current, medications: current.medications.map((item, itemIndex) => itemIndex === index ? { ...item, dosage: event.target.value } : item) }))} maxLength={120} placeholder="Ex. 500 mg" required /></label>
                    <label>Fréquence<input value={medication.frequency} onChange={(event) => setPrescriptionForm((current) => ({ ...current, medications: current.medications.map((item, itemIndex) => itemIndex === index ? { ...item, frequency: event.target.value } : item) }))} maxLength={120} placeholder="Ex. 1 comprimé, 2 fois par jour" required /></label>
                    <label>Durée<input value={medication.duration} onChange={(event) => setPrescriptionForm((current) => ({ ...current, medications: current.medications.map((item, itemIndex) => itemIndex === index ? { ...item, duration: event.target.value } : item) }))} maxLength={100} placeholder="Ex. 5 jours" required /></label>
                  </div>
                </fieldset>
              ))}
              <label>Instructions complémentaires<textarea className="prescription-instructions" value={prescriptionForm.instructions} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, instructions: event.target.value })} maxLength={1500} rows={3} placeholder="Conseils, précautions ou instructions pour le patient" /></label>
              <div className="payment-fields">
                <label>Praticien prescripteur<input autoComplete="name" value={prescriptionForm.practitioner} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, practitioner: event.target.value })} maxLength={150} placeholder="Nom du praticien" required /></label>
                <label>Date et heure<input type="datetime-local" value={prescriptionForm.issued_at} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, issued_at: event.target.value })} required /></label>
              </div>
              {prescriptionError && <p className="patients-error" role="alert">{prescriptionError}</p>}
              <div className="payments-form-hint"><ShieldCheck size={15} /><span>Cette ordonnance est liée au dossier du patient et accessible uniquement à votre établissement.</span></div>
              <div className="patients-form-actions">
                <button className="patients-cancel" type="button" disabled={isPrescriptionSaving} onClick={closePrescriptionForm}>Annuler</button>
                <button className="button button--primary" type="submit" disabled={isPrescriptionSaving}>{isPrescriptionSaving ? "Enregistrement…" : "Enregistrer l’ordonnance"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isClinicalNoteFormOpen && (
        <div className="patients-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeClinicalNoteForm(); }}>
          <section className="patients-form-card clinical-note-form-card" role="dialog" aria-modal="true" aria-labelledby="clinical-note-form-title">
            <button className="patients-form-close" type="button" aria-label="Fermer" onClick={closeClinicalNoteForm}><X size={18} /></button>
            <span className="eyebrow">SUIVI MÉDICAL</span>
            <h2 id="clinical-note-form-title">Nouvelle consultation.</h2>
            <p>La consultation et ses observations seront conservées dans le dossier du patient.</p>
            <form className="signup-form clinical-note-form" onSubmit={saveClinicalNote}>
              <div className="payment-select-label">
                <span id="clinical-note-patient-label">Patient</span>
                <div className="payment-select-wrap">
                  <PatientSelect
                    options={patientOptions}
                    value={clinicalNoteForm.patient_id}
                    onChange={(patientId) => setClinicalNoteForm((current) => ({ ...current, patient_id: patientId }))}
                    labelId="clinical-note-patient-label"
                  />
                </div>
              </div>
              <label>Motif de consultation<input value={clinicalNoteForm.title} onChange={(event) => setClinicalNoteForm({ ...clinicalNoteForm, title: event.target.value })} maxLength={160} placeholder="Ex. Consultation générale" required /></label>
              <label>Observations médicales<textarea value={clinicalNoteForm.content} onChange={(event) => setClinicalNoteForm({ ...clinicalNoteForm, content: event.target.value })} maxLength={5000} rows={5} placeholder="Saisissez les observations utiles au suivi du patient." required /></label>
              <div className="payment-fields">
                <label>Praticien<input autoComplete="name" value={clinicalNoteForm.practitioner} onChange={(event) => setClinicalNoteForm({ ...clinicalNoteForm, practitioner: event.target.value })} maxLength={150} placeholder="Nom du médecin" required /></label>
                <label>Date et heure<input type="datetime-local" value={clinicalNoteForm.occurred_at} onChange={(event) => setClinicalNoteForm({ ...clinicalNoteForm, occurred_at: event.target.value })} required /></label>
              </div>
              {clinicalNoteError && <p className="patients-error" role="alert">{clinicalNoteError}</p>}
              <div className="payments-form-hint"><ShieldCheck size={15} /><span>Ces informations médicales sont sensibles et réservées à votre établissement.</span></div>
              <div className="patients-form-actions">
                <button className="patients-cancel" type="button" disabled={isClinicalNoteSaving} onClick={closeClinicalNoteForm}>Annuler</button>
                <button className="button button--primary" type="submit" disabled={isClinicalNoteSaving}>{isClinicalNoteSaving ? "Enregistrement…" : "Enregistrer la consultation"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isPaymentFormOpen && (
        <div className="patients-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePaymentForm(); }}>
          <section className="patients-form-card payment-form-card" role="dialog" aria-modal="true" aria-labelledby="payment-form-title">
            <button className="patients-form-close" type="button" aria-label="Fermer" onClick={closePaymentForm}><X size={18} /></button>
            <span className="eyebrow">ENCAISSEMENT</span>
            <h2 id="payment-form-title">Nouveau paiement.</h2>
            <p>Enregistrez les informations du règlement pour créer son reçu.</p>
            <form className="signup-form" onSubmit={savePayment}>
              <div className="payment-fields">
                <div className="payment-select-label">
                  <span id="payment-patient-label">Patient</span>
                  <div className="payment-select-wrap">
                    <PatientSelect
                      options={patientOptions}
                      value={paymentForm.patient_id}
                      onChange={(patientId) => setPaymentForm((current) => ({ ...current, patient_id: patientId }))}
                      labelId="payment-patient-label"
                    />
                  </div>
                </div>
                <label className="payment-select-label">Prestation
                  <div className="payment-select-wrap">
                    <select value={paymentForm.service} onChange={(event) => setPaymentForm({ ...paymentForm, service: event.target.value })} required>
                      <option value="" disabled>Choisir une prestation</option>
                      {services.map((service) => <option key={service.label} value={service.label}>{service.icon} {service.label}</option>)}
                    </select>
                    <ChevronDown size={15} className="payment-select-icon" />
                  </div>
                </label>
                <label>Montant encaissé (GNF)
                  <input type="number" inputMode="numeric" min="1" step="1" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} placeholder="Ex. 150000" required />
                </label>
                <label className="payment-select-label">Assurance
                  <div className="payment-select-wrap">
                    <select value={paymentForm.insured} onChange={(event) => setPaymentForm({ ...paymentForm, insured: event.target.value })} required>
                      <option value="false">Non assuré(e)</option>
                      <option value="true">Assuré(e)</option>
                    </select>
                    <ChevronDown size={15} className="payment-select-icon" />
                  </div>
                </label>
                <label className="payment-select-label">Statut du règlement
                  <div className="payment-select-wrap">
                    <select value={paymentForm.status} onChange={(event) => setPaymentForm({ ...paymentForm, status: event.target.value })} required>
                      <option value="paid">Payé</option>
                      <option value="partial">Paiement partiel</option>
                    </select>
                    <ChevronDown size={15} className="payment-select-icon" />
                  </div>
                </label>
                <label>Praticien
                  <input autoComplete="name" value={paymentForm.practitioner} onChange={(event) => setPaymentForm({ ...paymentForm, practitioner: event.target.value })} maxLength={150} placeholder="Nom du praticien" required />
                </label>
                <label className="payment-fields__datetime">Date et heure
                  <input type="datetime-local" value={paymentForm.occurred_at} onChange={(event) => setPaymentForm({ ...paymentForm, occurred_at: event.target.value })} required />
                </label>
              </div>
              {paymentError && <p className="patients-error" role="alert">{paymentError}</p>}
              <div className="payments-form-hint"><ShieldCheck size={15} /><span>Le montant saisi correspond à la somme encaissée. Les données sont réservées à votre établissement.</span></div>
              <div className="patients-form-actions">
                <button className="patients-cancel" type="button" onClick={closePaymentForm}>Annuler</button>
                <button className="button button--primary" type="submit" disabled={isPaymentSaving}>{isPaymentSaving ? "Enregistrement…" : "Enregistrer le paiement"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedInvoice && (
        <div className="patients-overlay invoice-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedInvoice(null); }}>
          <section className="invoice-card" role="dialog" aria-modal="true" aria-labelledby="invoice-title">
            <button className="patients-form-close invoice-close" type="button" aria-label="Fermer la facture" onClick={() => setSelectedInvoice(null)}><X size={18} /></button>
            <header className="invoice-brand">
              <span className="invoice-brand__mark"><Stethoscope size={23} /></span>
              <div><strong>Clinic DC</strong><small>Facture de prestation médicale</small></div>
            </header>
            <div className="invoice-title">
              <div><span>DOCUMENT DE PAIEMENT</span><h2 id="invoice-title">Facture / reçu</h2><p>Merci de votre confiance.</p></div>
              <span className={selectedInvoice.status === "partial" ? "payment-tag payment-tag--partial" : "payment-tag payment-tag--paid"}>{selectedInvoice.status === "partial" ? "Paiement partiel" : "Payé"}</span>
            </div>
            <div className="invoice-reference">
              <div><span>RÉFÉRENCE</span><strong>{selectedInvoice.id.slice(-8).toUpperCase()}</strong></div>
              <div><span>DATE ET HEURE</span><strong>{new Intl.DateTimeFormat("fr-GN", { dateStyle: "long", timeStyle: "short" }).format(new Date(selectedInvoice.occurred_at))}</strong></div>
            </div>
            <div className="invoice-details">
              <div><span>Patient</span><strong>{selectedInvoice.patient_name}</strong></div>
              <div><span>Prestation</span><strong>{selectedInvoice.service}</strong></div>
              <div><span>Praticien</span><strong>{selectedInvoice.practitioner}</strong></div>
              <div><span>Assurance</span><strong>{selectedInvoice.insured ? "Assuré(e)" : "Non assuré(e)"}</strong></div>
            </div>
            <div className="invoice-total"><span>Montant encaissé</span><strong>{formatAmount(selectedInvoice.amount)} <small>GNF</small></strong></div>
            <footer className="invoice-footer">Document généré par Clinic DC · {user.email}</footer>
            <div className="invoice-actions">
              <button className="patients-cancel" type="button" onClick={() => setSelectedInvoice(null)}>Fermer</button>
              <button className="button button--primary" type="button" onClick={() => window.print()}><Printer size={16} /> Imprimer la facture</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
