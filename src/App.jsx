import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Menu,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { requireSupabase, supabase } from "./lib/supabase";
import PatientsWorkspace from "./PatientsWorkspace";

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    icon: ClipboardList,
    number: "01",
    title: "Les dossiers, enfin à leur place.",
    description:
      "Retrouvez l’historique, les notes et les informations de chaque patient dans un dossier clair, accessible aux bonnes personnes.",
    tag: "DOSSIERS PATIENTS",
    visual: "records",
  },
  {
    icon: CalendarDays,
    number: "02",
    title: "Un agenda qui garde le rythme.",
    description:
      "Visualisez les consultations à venir, coordonnez l’équipe et gardez une vue nette sur la journée de votre établissement.",
    tag: "RENDEZ-VOUS",
    visual: "calendar",
  },
  {
    icon: Package,
    number: "03",
    title: "Chaque ressource sous contrôle.",
    description:
      "Suivez les entrées et les niveaux de stock, gardez un œil sur les factures et repérez plus vite ce qui demande votre attention.",
    tag: "STOCKS & FACTURES",
    visual: "inventory",
    image: "/images/healthcare/pharmacienne-pharmacie.avif",
    imageAlt: "Pharmacienne noire travaillant sur un ordinateur dans sa pharmacie",
  },
];

const plans = [
  {
    id: "essentiel",
    name: "Essentiel",
    audience: "Pour les cabinets qui démarrent.",
    price: "150 000",
    unit: "GNF / mois",
    description: "Les outils indispensables pour organiser les consultations et les dossiers.",
    features: [
      "1 établissement",
      "Jusqu’à 3 membres de l’équipe",
      "Dossiers et historique patients",
      "Agenda et suivi des rendez-vous",
      "Vue d’ensemble de l’activité",
      "Assistance par e-mail",
    ],
    action: "Choisir Essentiel",
  },
  {
    id: "clinic",
    name: "Clinique",
    audience: "Pour les équipes en pleine activité.",
    price: "350 000",
    unit: "GNF / mois",
    description: "Une gestion plus complète pour coordonner l’équipe et les opérations.",
    features: [
      "Tout le forfait Essentiel",
      "Jusqu’à 10 membres de l’équipe",
      "Facturation et suivi des paiements",
      "Gestion des stocks et alertes",
      "Rôles d’accès pour l’équipe",
      "Rapports d’activité",
      "Assistance prioritaire",
    ],
    action: "Choisir Clinique",
    featured: true,
    badge: "LE PLUS CHOISI",
  },
  {
    id: "etablissement",
    name: "Établissement",
    audience: "Pour les hôpitaux et réseaux de soins.",
    price: "Sur devis",
    unit: "offre personnalisée",
    description: "Un accompagnement adapté à votre organisation et à ses besoins.",
    features: [
      "Tout le forfait Clinique",
      "Plusieurs établissements",
      "Équipe et accès personnalisés",
      "Mise en place accompagnée",
      "Formation à la prise en main",
      "Référent dédié",
    ],
    action: "Parler à l’équipe",
  },
];

const appointments = [
  { time: "09:00", name: "Aminata Camara", type: "Consultation générale", color: "lilac" },
  { time: "09:45", name: "Mamadou Diallo", type: "Suivi de consultation", color: "mint" },
  { time: "10:30", name: "Fatoumata Barry", type: "Consultation générale", color: "peach" },
];

function Brand({ footer = false }) {
  return (
    <a className={`brand${footer ? " brand--footer" : ""}`} href="#accueil" aria-label="Clinic DC, accueil">
      <span className="brand-mark" aria-hidden="true">
        <img src="/clinic-dc-mark.svg" alt="" />
      </span>
      <span className="brand-name">Clinic<span> DC</span></span>
    </a>
  );
}

const facilityTypes = [
  { name: "Cabinet médical", description: "Cabinet de soins indépendant", icon: Stethoscope },
  { name: "Clinique", description: "Clinique et centre de soins privé", icon: Building2 },
  { name: "Hôpital", description: "Hôpital et centre hospitalier", icon: Hospital },
  { name: "Autre établissement de santé", description: "Centre spécialisé ou autre structure", icon: HeartPulse },
];

const signupRedirectUrl = () => `${window.location.origin}/?signup=confirmed`;

function FacilitySelect({ value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedFacility = facilityTypes.find((facility) => facility.name === value);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const openOptions = () => {
    const selectedIndex = facilityTypes.findIndex((facility) => facility.name === value);
    const nextIndex = selectedIndex === -1 ? 0 : selectedIndex;
    setActiveIndex(nextIndex);
    setIsOpen(true);
    requestAnimationFrame(() => optionRefs.current[nextIndex]?.focus());
  };

  const handleOptionKeyDown = (event, index) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (index + direction + facilityTypes.length) % facilityTypes.length;
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const nextIndex = event.key === "Home" ? 0 : facilityTypes.length - 1;
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
    }
  };

  const SelectedIcon = selectedFacility?.icon;

  return (
    <div className={`facility-select${isOpen ? " facility-select--open" : ""}`} ref={selectRef}>
      <button
        ref={triggerRef}
        className={`facility-select__trigger${error ? " facility-select__trigger--error" : ""}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="facility-options"
        aria-required="true"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "facility-error" : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openOptions())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!isOpen) openOptions();
          }
        }}
      >
        <span className={`facility-select__icon${SelectedIcon ? " facility-select__icon--selected" : ""}`}>
          {SelectedIcon ? <SelectedIcon size={19} /> : <Building2 size={19} />}
        </span>
        <span className="facility-select__value">
          <strong>{selectedFacility?.name ?? "Sélectionner un établissement"}</strong>
          <small>{selectedFacility?.description ?? "Choisissez le type de votre structure"}</small>
        </span>
        <ChevronDown className={isOpen ? "facility-select__chevron facility-select__chevron--open" : "facility-select__chevron"} size={17} />
      </button>
      {isOpen && (
        <div className="facility-select__options" id="facility-options" role="listbox" aria-label="Types d’établissement">
          {facilityTypes.map(({ name, description, icon: Icon }, index) => (
            <button
              key={name}
              ref={(element) => { optionRefs.current[index] = element; }}
              className={`facility-select__option${value === name ? " facility-select__option--selected" : ""}`}
              type="button"
              role="option"
              aria-selected={value === name}
              tabIndex={activeIndex === index ? 0 : -1}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              onClick={() => {
                onChange(name);
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <span className="facility-select__icon"><Icon size={19} /></span>
              <span className="facility-select__option-copy"><strong>{name}</strong><small>{description}</small></span>
              {value === name && <Check className="facility-select__check" size={17} />}
            </button>
          ))}
        </div>
      )}
      {error && <span className="facility-select__error" id="facility-error">{error}</span>}
    </div>
  );
}

async function saveEstablishmentProfile(userId, fullNameValue, establishment) {
  const { error } = await requireSupabase().from("establishments").upsert({
    user_id: userId,
    full_name: fullNameValue,
    establishment_name: establishment.name,
    facility_type: establishment.type,
    address: establishment.address,
    country: establishment.country,
    city: establishment.city,
    phone: establishment.phone,
    team_size: establishment.teamSize,
    logo_url: establishment.logoUrl,
  }, { onConflict: "user_id" });
  if (error) throw error;
}

async function uploadEstablishmentLogo(userId, file) {
  if (!file) return "";
  const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
  const extension = extensions[file.type];
  if (!extension || file.size > 2 * 1024 * 1024) {
    throw new Error("Le logo doit être une image PNG, JPG ou WebP de 2 Mo maximum.");
  }
  const path = `${userId}/logo.${extension}`;
  const { error } = await requireSupabase().storage
    .from("establishment-logos")
    .upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: true });
  if (error) throw error;
  return requireSupabase().storage.from("establishment-logos").getPublicUrl(path).data.publicUrl;
}

function SignupModal({ open, onClose, mode, onModeChange, confirmedSignupUser, onSignupConfirmationHandled }) {
  const [submitted, setSubmitted] = useState(false);
  const [facility, setFacility] = useState("");
  const [facilityError, setFacilityError] = useState("");
  const [signupStep, setSignupStep] = useState("identity");
  const [signupError, setSignupError] = useState("");
  const [resendNotice, setResendNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isSignupPasswordVisible, setIsSignupPasswordVisible] = useState(false);
  const [establishment, setEstablishment] = useState(null);
  const [signupUser, setSignupUser] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(logoFile);
    setLogoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [logoFile]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setFacility("");
      setFacilityError("");
      setSignupStep("identity");
      setSignupError("");
      setResendNotice("");
      setIsSubmitting(false);
      setIsResending(false);
      setFullName("");
      setEmail("");
      setPassword("");
      setEstablishment(null);
      setSignupUser(null);
      setLogoFile(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !confirmedSignupUser) return;
    setFullName(confirmedSignupUser.user_metadata?.full_name ?? "");
    setEmail(confirmedSignupUser.email ?? "");
    setSignupUser(confirmedSignupUser);
    setSignupStep("establishment");
    setSignupError("");
    onSignupConfirmationHandled();
  }, [open, confirmedSignupUser, onSignupConfirmationHandled]);

  const submitSignupStep = async (event) => {
    event.preventDefault();
    setSignupError("");
    setIsSubmitting(true);
    try {
      if (signupStep === "identity") {
        const { data, error } = await requireSupabase().auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: signupRedirectUrl(),
          },
        });
        if (error) throw error;
        if (!data.user) throw new Error("Supabase n’a pas créé votre demande d’inscription. Réessayez.");
        setEmail(data.user.email ?? email);
        if (data.session) {
          setSignupUser(data.user);
          setSignupStep("establishment");
        } else {
          setSignupStep("confirmation");
        }
      } else if (signupStep === "establishment") {
        if (!facility) {
          setFacilityError("Sélectionnez le type de votre établissement pour continuer.");
          return;
        }
        const form = new FormData(event.currentTarget);
        const selectedLogo = form.get("logo");
        const logo = selectedLogo instanceof File && selectedLogo.size > 0 ? selectedLogo : null;
        const establishmentDetails = {
          name: String(form.get("facilityName") ?? "").trim(),
          type: facility,
          address: String(form.get("address") ?? "").trim(),
          country: String(form.get("country") ?? "").trim(),
          city: String(form.get("city") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
          teamSize: String(form.get("teamSize") ?? ""),
        };
        if (logo && (!["image/png", "image/jpeg", "image/webp"].includes(logo.type) || logo.size > 2 * 1024 * 1024)) {
          throw new Error("Le logo doit être une image PNG, JPG ou WebP de 2 Mo maximum.");
        }
        if (!signupUser) throw new Error("Confirmez d’abord votre adresse e-mail depuis le lien reçu.");
        establishmentDetails.logoUrl = await uploadEstablishmentLogo(signupUser.id, logo);
        await saveEstablishmentProfile(signupUser.id, signupUser.user_metadata?.full_name ?? fullName, establishmentDetails);
        setEstablishment(establishmentDetails);
        setSubmitted(true);
      }
    } catch (error) {
      setSignupError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendConfirmationLink = async () => {
    setResendNotice("");
    setSignupError("");
    setIsResending(true);
    try {
      const { error } = await requireSupabase().auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: signupRedirectUrl() },
      });
      if (error) throw error;
      setResendNotice(`Un nouveau lien de confirmation a été envoyé à ${email}.`);
    } catch (error) {
      setSignupError(error.message);
    } finally {
      setIsResending(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="signup-modal" role="dialog" aria-modal="true" aria-labelledby="signup-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Fermer">
          <X size={19} />
        </button>
        {submitted ? (
          <div className="signup-success">
            <span className="success-mark"><Check size={23} /></span>
            <span className="eyebrow">{mode === "login" ? "CONNEXION RÉUSSIE" : "ADRESSE VÉRIFIÉE"}</span>
            <h2 id="signup-title">Bienvenue sur Clinic DC.</h2>
            <p>
              {mode === "login"
                ? "Vous êtes connecté à votre compte Clinic DC."
                : "Votre compte et les informations de votre établissement ont été enregistrés."}
            </p>
            <button className="button button--primary" onClick={onClose}>Compris</button>
          </div>
        ) : (
          <>
            {mode === "login" ? (
              <>
                <span className="eyebrow">HEUREUX DE VOUS RETROUVER</span>
                <h2 id="signup-title">Se connecter.</h2>
                <p className="modal-intro">Saisissez vos identifiants pour accéder à votre espace Clinic DC.</p>
                <form className="signup-form" onSubmit={async (event) => {
                  event.preventDefault();
                  setSignupError("");
                  setIsSubmitting(true);
                  const form = new FormData(event.currentTarget);
                  try {
                    const { error } = await requireSupabase().auth.signInWithPassword({
                      email: String(form.get("email") ?? "").trim().toLowerCase(),
                      password: String(form.get("password") ?? ""),
                    });
                    if (error) throw error;
                    setSubmitted(true);
                  } catch (error) {
                    setSignupError(error.message);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}>
                  <label>Adresse e-mail<input autoComplete="email" name="email" placeholder="vous@exemple.com" type="email" required /></label>
                  <div className="signup-password-field">
                    <label htmlFor="login-password">Mot de passe</label>
                    <span className="password-visibility-field">
                      <input id="login-password" autoComplete="current-password" name="password" placeholder="Votre mot de passe" type={isLoginPasswordVisible ? "text" : "password"} required />
                      <button type="button" className="password-visibility-toggle" aria-label={isLoginPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={isLoginPasswordVisible} onClick={() => setIsLoginPasswordVisible((visible) => !visible)}>
                        {isLoginPasswordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </span>
                  </div>
                  {signupError && <p className="signup-error" role="alert">{signupError}</p>}
                  <button className="button button--primary signup-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Connexion…" : "Se connecter"} {!isSubmitting && <ArrowRight size={16} />}</button>
                  <p className="form-note"><LockKeyhole size={13} /> Vos informations restent confidentielles.</p>
                </form>
                <button className="auth-switch" type="button" onClick={() => onModeChange("signup")}>Pas encore de compte ? S’inscrire</button>
              </>
            ) : (
              <>
                <span className="eyebrow">VOTRE ÉTABLISSEMENT, MIEUX ORGANISÉ</span>
                <div className="signup-progress" aria-label={`Étape ${
                  signupStep === "identity" ? "1" : signupStep === "confirmation" ? "2" : "3"
                } sur 3`}>
                  {["identity", "confirmation", "establishment"].map((step, index) => (
                    <span
                      key={step}
                      className={["identity", "confirmation", "establishment"].indexOf(signupStep) >= index
                        ? "signup-progress__step signup-progress__step--complete"
                        : "signup-progress__step"}
                    />
                  ))}
                </div>
                <h2 id="signup-title">
                  {signupStep === "identity" ? "Créer votre compte." : signupStep === "confirmation" ? "Confirmez votre adresse." : "Votre établissement."}
                </h2>
                <p className="modal-intro">
                  {signupStep === "identity"
                    ? "Commencez avec votre nom, votre adresse Gmail et un mot de passe sécurisé."
                    : signupStep === "confirmation"
                      ? `Un lien de confirmation a été envoyé à ${email}. Cliquez dessus depuis votre boîte mail pour poursuivre votre inscription.`
                      : `Adresse confirmée : ${email}. Complétez les informations de votre établissement pour terminer l’inscription.`}
                </p>
                {signupStep === "confirmation" ? (
                  <div className="signup-confirmation">
                    <span className="signup-confirmation__icon"><Mail size={24} /></span>
                    <p>Ouvrez l’e-mail de Clinic DC et cliquez sur le lien de confirmation. Vous reviendrez ensuite ici pour terminer votre inscription.</p>
                    {signupError && <p className="signup-error" role="alert">{signupError}</p>}
                    <button className="button button--primary signup-submit" type="button" disabled={isResending} onClick={resendConfirmationLink}>
                      {isResending ? "Envoi du lien…" : "Renvoyer le lien"}
                    </button>
                    {resendNotice && <p className="auth-status-notice" role="status">{resendNotice}</p>}
                    <button className="auth-switch" type="button" onClick={() => { setSignupError(""); setSignupStep("identity"); }}>
                      Modifier mes coordonnées
                    </button>
                  </div>
                ) : (
                  <form className="signup-form" key={`${mode}-${signupStep}`} onSubmit={submitSignupStep}>
                    {signupStep === "identity" ? (
                      <>
                        <label>
                          Nom complet
                          <input autoComplete="name" name="name" placeholder="Ex. Aïssatou Bah" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={100} required />
                        </label>
                        <label>
                          Adresse Gmail
                          <input autoComplete="email" name="email" placeholder="vous@gmail.com" type="email" pattern="[^@ ]+@(gmail[.]com|googlemail[.]com)" title="Utilisez une adresse se terminant par @gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                        </label>
                        <div className="signup-password-field">
                          <label htmlFor="signup-password">Mot de passe</label>
                          <span className="password-visibility-field">
                            <input id="signup-password" autoComplete="new-password" name="password" placeholder="10 caractères minimum" type={isSignupPasswordVisible ? "text" : "password"} minLength={10} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
                            <button type="button" className="password-visibility-toggle" aria-label={isSignupPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={isSignupPasswordVisible} onClick={() => setIsSignupPasswordVisible((visible) => !visible)}>
                              {isSignupPasswordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                          </span>
                        </div>
                        <p className="form-note"><LockKeyhole size={13} /> Votre adresse doit être confirmée avant l’activation du compte.</p>
                      </>
                    ) : (
                      <>
                        <label>Nom de l’établissement<input autoComplete="organization" name="facilityName" placeholder="Ex. Clinique de la Concorde" maxLength={150} required /></label>
                        <div className="signup-field">
                          <span>Type d’établissement</span>
                          <FacilitySelect value={facility} onChange={(value) => { setFacility(value); setFacilityError(""); }} error={facilityError} />
                        </div>
                        <div className="signup-form__row">
                          <label>Ville<input autoComplete="address-level2" name="city" placeholder="Ex. Conakry" maxLength={100} required /></label>
                          <label>Pays<input autoComplete="country-name" name="country" defaultValue="Guinée" maxLength={100} required /></label>
                        </div>
                        <label>Adresse / résidence<input autoComplete="street-address" name="address" placeholder="Ex. Quartier, rue et numéro" maxLength={200} required /></label>
                        <div className="signup-form__row">
                          <label>Téléphone<input autoComplete="tel" name="phone" type="tel" placeholder="+224 6XX XX XX XX" maxLength={40} required /></label>
                          <label>Taille de l’équipe
                            <select name="teamSize" defaultValue="" required>
                              <option value="" disabled>Sélectionner</option>
                              <option value="1-5">1 à 5 personnes</option>
                              <option value="6-20">6 à 20 personnes</option>
                              <option value="21-50">21 à 50 personnes</option>
                              <option value="51+">Plus de 50 personnes</option>
                            </select>
                          </label>
                        </div>
                        <div className="signup-field">
                          <label htmlFor="establishment-logo">Logo de l’organisation <span>(facultatif)</span></label>
                          <input id="establishment-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
                          <small>PNG, JPG ou WebP · 2 Mo maximum. Il figurera sur les documents imprimés.</small>
                          {logoPreview && <img className="signup-logo-preview" src={logoPreview} alt="Aperçu du logo de l’établissement" />}
                        </div>
                      </>
                    )}
                    {signupError && <p className="signup-error" role="alert">{signupError}</p>}
                    <button className="button button--primary signup-submit" type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Veuillez patienter…"
                        : signupStep === "identity" ? "Envoyer le lien" : "Créer mon compte"}
                      {!isSubmitting && <ArrowRight size={16} />}
                    </button>
                    <p className="form-note"><LockKeyhole size={13} /> Vos informations restent confidentielles.</p>
                  </form>
                )}
                {signupStep === "identity" ? (
                  <button className="auth-switch" type="button" onClick={() => onModeChange("login")}>Déjà un compte ? Se connecter</button>
                ) : signupStep === "establishment" ? (
                  <button
                    className="auth-switch"
                    type="button"
                    onClick={() => {
                      setSignupError("");
                      setSignupStep("identity");
                    }}
                  >
                    ← Modifier mes coordonnées
                  </button>
                ) : null}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="dashboard-shell" aria-label="Aperçu de l’interface Clinic DC">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo"><span className="mini-mark"><HeartPulse size={15} /></span> Clinic DC</div>
        <span className="sidebar-label">ESPACE DE TRAVAIL</span>
        <div className="sidebar-link sidebar-link--active"><LayoutDashboard size={15} /> Vue d’ensemble</div>
        <div className="sidebar-link"><UsersRound size={15} /> Patients <span className="nav-count">248</span></div>
        <div className="sidebar-link"><CalendarDays size={15} /> Rendez-vous</div>
        <div className="sidebar-link"><FileText size={15} /> Facturation</div>
        <div className="sidebar-link"><Package size={15} /> Inventaire</div>
        <div className="sidebar-bottom">
          <div className="sidebar-link"><CircleHelp size={15} /> Centre d’aide</div>
          <div className="profile-mini"><span className="avatar avatar--purple">AK</span><span><b>Dr. Aïssatou K.</b><small>Administratrice</small></span><ChevronDown size={13} /></div>
        </div>
      </aside>
      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <span>Mercredi, 14 octobre</span>
          <div className="topbar-actions"><span className="secure-status"><span /> Données sécurisées</span><button className="bell-button" aria-label="Notifications"><Bell size={16} /><i /></button><span className="avatar avatar--photo">AK</span></div>
        </div>
        <div className="dashboard-heading">
          <div><span className="dashboard-overline">VOTRE ESPACE DE SOIN</span><h3>Bonjour, Aïssatou <span>✳</span></h3><p>Voici le rythme de votre établissement aujourd’hui.</p></div>
          <button className="dashboard-add"><Plus size={15} /> Nouveau rendez-vous</button>
        </div>
        <div className="metric-grid">
          <div className="metric-card"><div className="metric-icon metric-icon--violet"><UsersRound size={16} /></div><span>Patients suivis</span><strong>248</strong><small><span className="metric-up">+12</span> ce mois-ci</small></div>
          <div className="metric-card"><div className="metric-icon metric-icon--blue"><CalendarDays size={16} /></div><span>Rendez-vous aujourd’hui</span><strong>18</strong><small>Prochain à <b>09:00</b></small></div>
          <div className="metric-card"><div className="metric-icon metric-icon--green"><Activity size={16} /></div><span>Stock à surveiller</span><strong>03</strong><small><span className="stock-dot" /> Réapprovisionnement</small></div>
        </div>
        <div className="dashboard-lower">
          <section className="schedule-card">
            <div className="widget-heading"><div><b>Votre journée</b><small>Les prochaines consultations</small></div><button aria-label="Voir le calendrier"><ArrowUpRight size={16} /></button></div>
            <div className="schedule-list">
              {appointments.map((appointment) => (
                <div className="appointment-row" key={appointment.time}>
                  <span className="appointment-time">{appointment.time}</span>
                  <span className={`appointment-avatar appointment-avatar--${appointment.color}`}>{appointment.name.split(" ").map((part) => part[0]).join("")}</span>
                  <span className="appointment-info"><b>{appointment.name}</b><small>{appointment.type}</small></span>
                  <span className="appointment-more">···</span>
                </div>
              ))}
            </div>
            <a href="#fonctionnalites" className="widget-link">Voir tout l’agenda <ArrowRight size={13} /></a>
          </section>
          <section className="activity-card">
            <div className="widget-heading"><div><b>À garder en vue</b><small>Votre établissement</small></div><span className="live-pill"><i /> EN DIRECT</span></div>
            <div className="activity-item"><span className="activity-icon activity-icon--orange"><Package size={14} /></span><span><b>Gants d’examen</b><small>Stock bientôt épuisé</small></span><span className="activity-alert">À vérifier</span></div>
            <div className="activity-item"><span className="activity-icon activity-icon--violet"><Wallet size={14} /></span><span><b>Facture #FC-204</b><small>Émise aujourd’hui</small></span><span className="activity-check"><Check size={13} /></span></div>
            <div className="activity-foot"><ShieldCheck size={14} /> Suivi centralisé, équipe alignée.</div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ServiceVisual({ type }) {
  if (type === "records") {
    return (
      <div className="service-visual records-visual">
        <div className="record-top"><span className="avatar avatar--rose">AB</span><span><b>Aminata Bah</b><small>Dossier patient · CD-0248</small></span><span className="record-status">ACTIF</span></div>
        <div className="record-line record-line--wide" /><div className="record-line record-line--short" />
        <div className="record-bottom"><span><Clock3 size={12} /> Mis à jour aujourd’hui</span><ArrowUpRight size={14} /></div>
      </div>
    );
  }
  if (type === "calendar") {
    return (
      <div className="service-visual calendar-visual">
        <div className="mini-calendar-head"><span>OCTOBRE 2026</span><span>‹ &nbsp; ›</span></div>
        <div className="mini-calendar-grid">{["L", "M", "M", "J", "V", "S", "D", "12", "13", "14", "15", "16", "17", "18"].map((d, i) => <span className={i === 9 ? "selected-day" : ""} key={`${d}-${i}`}>{d}</span>)}</div>
        <div className="calendar-event"><i /> 09:00 <b>Consultation générale</b></div>
      </div>
    );
  }
  return (
    <div className="service-visual inventory-visual">
      <div className="inventory-row inventory-heading"><span>ARTICLE</span><span>DISPONIBILITÉ</span></div>
      <div className="inventory-row"><span><i className="inventory-dot inventory-dot--violet" /> Gants d’examen</span><span><i className="stock-bar stock-bar--low" /> Bas</span></div>
      <div className="inventory-row"><span><i className="inventory-dot inventory-dot--blue" /> Sérum physiologique</span><span><i className="stock-bar stock-bar--good" /> Stable</span></div>
      <div className="inventory-row"><span><i className="inventory-dot inventory-dot--green" /> Compresses stériles</span><span><i className="stock-bar stock-bar--good" /> Stable</span></div>
    </div>
  );
}

function PricingCard({ plan, onSelect }) {
  const glowRef = useRef(null);
  const moveGlow = useRef(null);

  useEffect(() => {
    if (!glowRef.current) return undefined;
    gsap.set(glowRef.current, { x: -220, y: -220 });
    moveGlow.current = {
      x: gsap.quickTo(glowRef.current, "x", { duration: 0.45, ease: "power3.out" }),
      y: gsap.quickTo(glowRef.current, "y", { duration: 0.45, ease: "power3.out" }),
    };
    return () => gsap.killTweensOf(glowRef.current);
  }, []);

  const followPointer = (event) => {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !moveGlow.current
    ) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    moveGlow.current.x(event.clientX - bounds.left - 220);
    moveGlow.current.y(event.clientY - bounds.top - 220);
  };

  return (
    <article
      className={`pricing-card${plan.featured ? " pricing-card--featured" : ""}`}
      onPointerMove={followPointer}
      onPointerLeave={() => {
        moveGlow.current?.x(-220);
        moveGlow.current?.y(-220);
      }}
    >
      <div className="pricing-card__glow" ref={glowRef} aria-hidden="true" />
      <div className="pricing-card__content">
        <div className="pricing-card__top">
          <span className="pricing-card__icon"><HeartPulse size={17} /></span>
          {plan.badge && <span className="pricing-badge">{plan.badge}</span>}
        </div>
        <span className="pricing-audience">{plan.audience}</span>
        <h3>{plan.name}</h3>
        <p className="pricing-description">{plan.description}</p>
        <div className="pricing-price">
          <strong>{plan.price}</strong>
          <span>{plan.unit}</span>
        </div>
        <div className="pricing-divider" />
        <span className="pricing-includes">CE FORFAIT COMPREND</span>
        <ul className="pricing-features">
          {plan.features.map((feature) => (
            <li key={feature}><Check size={14} /><span>{feature}</span></li>
          ))}
        </ul>
        <button
          className={`button ${plan.featured ? "button--primary" : "button--plan"}`}
          onClick={() => onSelect(plan)}
        >
          {plan.action} <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}

function App() {
  const rootRef = useRef(null);
  const [signupOpen, setSignupOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [confirmedSignupUser, setConfirmedSignupUser] = useState(null);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const isDashboardPreview = new URLSearchParams(window.location.search).get("preview") === "dashboard";

  const clearConfirmedSignup = useCallback(() => setConfirmedSignupUser(null), []);

  useEffect(() => {
    if (!supabase) return undefined;
    const completeConfirmedSignup = (session) => {
      const url = new URL(window.location.href);
      if (url.searchParams.get("signup") !== "confirmed" || !session?.user) return;

      url.searchParams.delete("signup");
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
      setConfirmedSignupUser(session.user);
      setAuthMode("signup");
      setSignupOpen(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticatedUser(session?.user ?? null);
      completeConfirmedSignup(session);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Unable to restore Supabase session:", error.message);
        return;
      }
      setAuthenticatedUser(data.session?.user ?? null);
      completeConfirmedSignup(data.session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!root || reduceMotion) return undefined;

    const ctx = gsap.context(() => {
      gsap.from(".hero-copy > *", {
        y: 32,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power4.out",
        delay: 0.15,
      });
      gsap.utils.toArray(".reveal").forEach((element) => {
        gsap.from(element, {
          y: 22,
          opacity: 0,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        });
      });
      gsap.from(".manifesto-line", {
        y: 26,
        opacity: 0,
        duration: 1.1,
        stagger: 0.18,
        ease: "power4.out",
        scrollTrigger: { trigger: ".manifesto", start: "top 78%", once: true },
      });
      gsap.fromTo(".journey-ecg path", {
        strokeDashoffset: 1000,
      }, {
        strokeDashoffset: 0,
        duration: 2,
        ease: "power2.inOut",
        scrollTrigger: { trigger: ".journey-steps", start: "top 72%", once: true },
      });
      gsap.to(".journey-photo", {
        keyframes: [
          { x: 0, y: -2 },
          { x: 2, y: 0 },
          { x: 0, y: 2 },
          { x: -2, y: 0 },
          { x: 0, y: -2 },
        ],
        duration: 10,
        repeat: -1,
        ease: "sine.inOut",
        stagger: 0.35,
      });
    }, root);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const items = gsap.utils.toArray(".ambient-motion__item");
    const setters = items.map((element, index) => {
      const depth = Number(element.dataset.depth ?? 1);
      return {
        x: gsap.quickTo(element, "x", { duration: 0.8, ease: "power2.out" }),
        y: gsap.quickTo(element, "y", { duration: 0.9, ease: "power2.out" }),
        rotation: gsap.quickTo(element, "rotation", { duration: 1.1, ease: "power2.out" }),
        depth,
        direction: index % 2 === 0 ? 1 : -1,
      };
    });

    let pointerX = 0;
    let pointerY = 0;
    let scrollProgress = 0;

    const updateMotion = () => {
      setters.forEach(({ x, y, rotation, depth, direction }) => {
        x(pointerX * depth * 34);
        y(pointerY * depth * 26 + scrollProgress * depth * 38);
        rotation((pointerX * 5 + scrollProgress * 8) * depth * direction);
      });
    };
    const handlePointerMove = (event) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
      updateMotion();
    };
    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight - 0.5 : 0;
      updateMotion();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
      items.forEach((element) => gsap.killTweensOf(element));
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const openSignup = () => {
    setMenuOpen(false);
    setAuthMode("signup");
    setSignupOpen(true);
  };
  const openLogin = () => {
    setMenuOpen(false);
    setAuthMode("login");
    setSignupOpen(true);
  };
  const signOut = async () => {
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw error;
  };

  if (isDashboardPreview) {
    return (
      <PatientsWorkspace
        user={{ email: "admin@clinicdc.test", user_metadata: { full_name: "Administrateur Clinic DC (démo)" } }}
        isDemo
        onSignOut={() => window.location.assign(window.location.pathname)}
      />
    );
  }

  if (authenticatedUser && !signupOpen) {
    return <PatientsWorkspace user={authenticatedUser} onSignOut={signOut} />;
  }

  return (
    <main ref={rootRef} data-theme="clinic-care">
      <div className="ambient-motion" aria-hidden="true">
        <div className="ambient-motion__item ambient-motion__glow ambient-motion__glow--mint" data-depth="1.1" />
        <div className="ambient-motion__item ambient-motion__glow ambient-motion__glow--blue" data-depth="0.75" />
        <div className="ambient-motion__item ambient-motion__ring" data-depth="1.35" />
        <div className="ambient-motion__item ambient-motion__cross ambient-motion__cross--one" data-depth="1.6">+</div>
        <div className="ambient-motion__item ambient-motion__cross ambient-motion__cross--two" data-depth="0.8">+</div>
        <svg className="ambient-motion__item ambient-motion__pulse" data-depth="1.25" viewBox="0 0 520 120">
          <path d="M0 62h140l24-1 18-24 20 49 24-67 24 44h74l18-1 20-18 19 38 19-20h120" />
        </svg>
      </div>
      <header className="site-header">
        <Brand />
        <nav className={`main-nav${menuOpen ? " main-nav--open" : ""}`} aria-label="Navigation principale">
          <a href="#fonctionnalites" onClick={closeMenu}>Fonctions</a>
          <a href="#parcours" onClick={closeMenu}>Parcours</a>
          <a href="#tarifs" onClick={closeMenu}>Tarifs</a>
          <a href="?preview=dashboard" onClick={closeMenu}>Démo admin</a>
          <a className="login-link login-link--nav" href="#connexion" onClick={(event) => { event.preventDefault(); openLogin(); }}>Connexion</a>
          <button className="mobile-signup" onClick={openSignup}>S’inscrire <ArrowRight size={15} /></button>
        </nav>
        <div className="header-actions">
          <button className="button button--header" onClick={openLogin}>Se connecter</button>
        </div>
        <button className="menu-toggle" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <section className="hero" id="accueil">
        <div className="hero-atmosphere" aria-hidden="true"><div className="hero-orb hero-orb--one" /><div className="hero-orb hero-orb--two" /><div className="hero-grid" /></div>
        <div className="hero-copy">
          <div className="hero-kicker"><span className="kicker-pulse" /> LOGICIEL DE GESTION CLINIQUE · GUINÉE</div>
          <h1>Moins de papiers,<br />plus de temps pour le<br /><em>soin.</em></h1>
          <p className="hero-description">Dossiers patients, rendez-vous, laboratoire, pharmacie et caisse — un seul outil pour toute votre équipe médicale.</p>
          <div className="hero-actions">
            <button className="button button--primary button--hero" onClick={openSignup}>S’inscrire <ArrowRight size={17} /></button>
            <a className="text-link" href="?preview=dashboard">Tester la démo admin <ArrowRight size={14} /></a>
            <a className="text-link" href="#tarifs">Voir les tarifs</a>
          </div>
        </div>
        <div className="hero-bottom"><span>UNE PLATEFORME, UNE VISION PLUS CLAIRE</span><span>CONÇU POUR LE QUOTIDIEN DES ÉQUIPES DE SOIN</span></div>
      </section>

      <section className="trust-strip" aria-label="Les outils de la plateforme">
        <span className="trust-label">TOUT L’ESSENTIEL, AU MÊME ENDROIT</span>
        <div className="trust-items"><span><UsersRound size={15} /> Patients</span><i /><span><CalendarDays size={15} /> Rendez-vous</span><i /><span><FileText size={15} /> Facturation</span><i /><span><Package size={15} /> Inventaire</span></div>
      </section>

      <section className="features section-pad" id="fonctionnalites">
        <div className="section-heading reveal">
          <div><span className="eyebrow"><Sparkles size={13} /> UN QUOTIDIEN PLUS FLUIDE</span><h2>Moins de dispersion.<br /><em>Plus de présence.</em></h2></div>
          <p>Quand l’organisation suit, vos équipes peuvent consacrer davantage d’énergie à l’essentiel : accompagner les patients.</p>
        </div>
        <div className="feature-grid">
          {services.map(({ icon: Icon, number, title, description, tag, visual, image, imageAlt }) => (
            <article className="feature-card reveal" key={number}>
              <div className="feature-card-top"><span className="feature-number">{number} / 03</span><span className="feature-icon"><Icon size={17} /></span></div>
              <h3>{title}</h3>
              <p>{description}</p>
              {image ? (
                <img className="feature-photo" src={image} alt={imageAlt} loading="lazy" />
              ) : (
                <ServiceVisual type={visual} />
              )}
              <span className="feature-tag">{tag}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="care-community section-pad" aria-labelledby="community-title">
        <div className="community-copy reveal">
          <span className="eyebrow"><HeartPulse size={14} /> AU CŒUR DU QUOTIDIEN DES SOINS</span>
          <h2 id="community-title">La technologie au service de <em>celles et ceux qui soignent.</em></h2>
          <p>
            Chaque établissement a son rythme, chaque équipe sa réalité. Clinic DC aide les
            professionnels de santé à garder une vue claire sur leur activité, pour laisser plus
            de place à l’écoute et à l’accompagnement.
          </p>
          <div className="community-values">
            <span><Check size={14} /> Pensé pour les équipes de soin</span>
            <span><Check size={14} /> Adapté aux réalités locales</span>
          </div>
        </div>
        <div className="community-gallery reveal" aria-label="Professionnelles de santé au travail">
          <figure className="community-photo community-photo--doctor">
            <img
              src="/images/healthcare/medecin-portrait.avif"
              alt="Médecin africaine en blouse et stéthoscope"
              loading="lazy"
            />
            <figcaption>MÉDECINE DE PROXIMITÉ</figcaption>
          </figure>
          <figure className="community-photo community-photo--team">
            <img
              src="/images/healthcare/soignante-au-poste.jpg"
              alt="Soignante en tenue bleue travaillant à un poste informatique"
              loading="lazy"
            />
            <figcaption>LE SOIN, AU QUOTIDIEN</figcaption>
          </figure>
        </div>
      </section>

      <section className="manifesto section-pad" id="approche">
        <div className="manifesto-glow" aria-hidden="true" />
        <span className="eyebrow eyebrow--light reveal"><span className="kicker-pulse" /> NOTRE CONVICTION</span>
        <div className="manifesto-copy">
          <p className="manifesto-line manifesto-muted">La gestion ne devrait pas prendre la place du soin.</p>
          <h2 className="manifesto-line">Nous réunissons votre quotidien dans un espace <em>plus clair.</em></h2>
        </div>
        <div className="manifesto-foot"><span>CLARTÉ POUR L’ÉQUIPE. CONTINUITÉ POUR LE PATIENT.</span><span className="manifesto-mark"><HeartPulse size={18} /></span></div>
      </section>

      <section className="journey section-pad" id="parcours">
        <div className="journey-heading reveal">
          <span className="eyebrow">VOTRE CLINIQUE, EN TOUTE SIMPLICITÉ</span>
          <h2>Trois étapes, <em>un rythme régulier.</em></h2>
        </div>
        <div className="journey-steps">
          <svg className="journey-ecg" viewBox="0 0 1200 320" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength="1000" d="M0 156 H255 L277 156 L293 96 L315 222 L339 156 H590 L612 156 L630 106 L651 215 L673 156 H930 L953 156 L971 104 L993 214 L1015 156 H1200" />
          </svg>
          <article className="journey-card journey-card--one reveal">
            <div className="journey-photo">
              <img src="/images/healthcare/medecin-portrait.avif" alt="Médecin prête à accueillir les patients dans sa clinique" loading="lazy" />
              <span className="journey-number">01</span>
            </div>
            <div className="journey-card-copy"><h3>Créez votre clinique</h3><p>Inscription en deux minutes : votre espace sécurisé est prêt.</p></div>
          </article>
          <article className="journey-card journey-card--two reveal">
            <div className="journey-photo">
              <img src="/images/equipe-soignante-clinic-dc.jpg" alt="Une équipe médicale réunie pour travailler ensemble" loading="lazy" />
              <span className="journey-number">02</span>
            </div>
            <div className="journey-card-copy"><h3>Invitez votre équipe</h3><p>Médecins, laborantins, pharmaciens, caissiers — chacun son accès.</p></div>
          </article>
          <article className="journey-card journey-card--three reveal">
            <div className="journey-photo">
              <img src="/images/healthcare/soignante-au-poste.jpg" alt="Une soignante organise ses consultations à l’ordinateur" loading="lazy" />
              <span className="journey-number">03</span>
            </div>
            <div className="journey-card-copy"><h3>Soignez et suivez</h3><p>Chaque visite alimente le dossier, le stock et la caisse.</p></div>
          </article>
        </div>
      </section>

      <section className="pricing section-pad" id="tarifs">
        <div className="pricing-heading reveal">
          <span className="eyebrow"><Sparkles size={13} /> DES OFFRES ADAPTÉES À VOTRE ÉTABLISSEMENT</span>
          <h2>Le bon rythme pour<br /><em>prendre soin.</em></h2>
          <p>Choisissez l’accompagnement qui correspond à votre équipe. Les tarifs ci-dessous sont indicatifs et pourront être ajustés avant le lancement.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} onSelect={openSignup} />
          ))}
        </div>
        <p className="pricing-note"><ShieldCheck size={14} /> Prix indicatifs en GNF, par mois. Les fonctionnalités et forfaits seront confirmés avant l’ouverture du service.</p>
      </section>

      <section className="contact section-pad" id="offre">
        <div className="contact-card reveal">
          <span className="eyebrow">GRANDES STRUCTURES · SUR MESURE</span>
          <h2>Votre clinique est unique. <em>Parlons-en.</em></h2>
          <p className="contact-intro">Une question, un doute, un projet ? Écrivez-nous simplement : nous vous répondons sous 24 h.</p>
          <form
            className="contact-form"
            onSubmit={(event) => {
              event.preventDefault();
              setContactSubmitted(true);
            }}
            onChange={() => setContactSubmitted(false)}
          >
            <input aria-label="Nom de la clinique" name="clinic" placeholder="Nom de la clinique" required />
            <input aria-label="Votre nom" name="name" placeholder="Votre nom" autoComplete="name" required />
            <input aria-label="E-mail" name="email" placeholder="E-mail" type="email" autoComplete="email" required />
            <input aria-label="Téléphone" name="phone" placeholder="Téléphone" type="tel" autoComplete="tel" required />
            <textarea aria-label="Votre message" name="message" placeholder="Dites-nous ce qui vous préoccupe..." rows="3" required />
            <button className="button button--primary contact-submit" type="submit">
              {contactSubmitted ? "Demande préparée" : "Envoyer mon message"}
            </button>
            <p className={`contact-status${contactSubmitted ? " contact-status--visible" : ""}`} role="status">
              {contactSubmitted ? "Votre demande est prête. L’envoi sera activé après le raccordement de la messagerie." : ""}
            </p>
          </form>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand-col">
            <Brand footer />
            <p className="footer-tagline">La clinique connectée, du dossier à la caisse.</p>
          </div>
          <div className="footer-links">
            <div><span className="footer-label">NAVIGATION</span><a href="#fonctionnalites">Fonctions</a><a href="#parcours">Parcours</a><a href="#tarifs">Tarifs</a><a href="#connexion" onClick={(event) => { event.preventDefault(); openLogin(); }}>Connexion</a></div>
            <div><span className="footer-label">LÉGAL</span><a href="#offre">Mentions légales</a><a href="#offre">Confidentialité</a></div>
          </div>
        </div>
        <div className="footer-bottom"><span>© 2026 Clinic_DC · Conakry · Tous droits réservés</span></div>
        <div className="creator-signature">
          <div className="creator-signature__copy">
            <p className="creator-signature__byline">Conçu et façonné par <b>Saidou DOUMBOUYA</b> · Ingénieur architecte</p>
            <p className="creator-signature__contact"><a href="mailto:clinicdc224@gmail.com">clinicdc224@gmail.com</a><span>·</span><a href="tel:+224614833310">+224 614 83 33 10</a></p>
          </div>
        </div>
      </footer>

      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
        confirmedSignupUser={confirmedSignupUser}
        onSignupConfirmationHandled={clearConfirmedSignup}
      />
    </main>
  );
}

export default App;
