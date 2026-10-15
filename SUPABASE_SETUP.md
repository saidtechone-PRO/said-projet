# Configuration de Supabase

## 1. Connecter le projet

Dans Supabase, ouvrez **Project Settings > API** et copiez l'URL du projet ainsi que la clé publique (publishable/anon). Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-publique
```

Ne placez jamais une clé `service_role` ou une clé secrète dans une variable `VITE_`. Redémarrez Vite après la création ou la modification de `.env`.

## 2. Créer la table protégée

Dans **SQL Editor** de Supabase, exécutez le contenu de [`supabase/establishments.sql`](./supabase/establishments.sql). Les politiques RLS limitent chaque utilisateur authentifié à la lecture et à la modification de son propre établissement.

## 3. Authentification par e-mail

Dans **Authentication > URL Configuration**, ajoutez les URL de redirection du site, notamment `http://localhost:5173` pour le développement et l'URL de production.

Dans **Authentication > Email Templates > Confirm signup**, utilisez le jeton à six chiffres `{{ .Token }}` dans le message et indiquez qu'il doit être saisi dans Clinic DC. Le formulaire envoie une demande d'inscription Supabase, collecte les renseignements de l'établissement, puis vérifie le code avant d'enregistrer ceux-ci.

## 4. Connexion Google

Dans **Authentication > Sign In / Providers > Google**, activez le fournisseur Google et fournissez les identifiants OAuth du projet Clinic DC. Dans Google Cloud, configurez l'URL de rappel Supabase indiquée dans le tableau de bord Supabase; ajoutez également les URL de site et de redirection dans les paramètres Supabase.

La connexion et l'inscription Google passent par Supabase OAuth. Une inscription Google revient dans Clinic DC pour demander les renseignements de l'établissement avant de les enregistrer.

## 5. Démarrer l'application

```sh
npm run dev
```

Sans variables Supabase, le site reste consultable, mais les opérations d'authentification affichent une erreur de configuration.
