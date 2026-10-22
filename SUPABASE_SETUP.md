# Configuration de Supabase

## 1. Connecter le projet

Dans Supabase, ouvrez **Project Settings > API** et copiez l'URL du projet ainsi que la clé publique (publishable/anon). Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-publique
```

Ne placez jamais une clé `service_role` ou une clé secrète dans une variable `VITE_`. Redémarrez Vite après la création ou la modification de `.env`.

## 2. Créer la table protégée

Dans **SQL Editor** de Supabase, exécutez tout le contenu de [`supabase/establishments.sql`](./supabase/establishments.sql). Le script peut être relancé : il configure l'établissement du compte, le stockage des logos et le répertoire des patients, et recrée les politiques RLS pour limiter chaque utilisateur authentifié à ses propres données. Il ajoute aussi les colonnes manquantes, crée les tables d'ordonnances et de notes médicales, puis demande à Supabase d'actualiser son cache de schéma. Les logos peuvent être au format PNG, JPG, WebP, GIF, AVIF ou BMP (2 Mo maximum) ; seuls les membres authentifiés peuvent téléverser ou remplacer le logo de leur propre établissement.

## 3. Authentification par e-mail

Dans **Authentication > URL Configuration**, ajoutez l'URL du site et les URL de redirection. Pour le développement, ajoutez par exemple `http://localhost:5173/?signup=confirmed` et `http://localhost:5173/?password-reset=confirmed` (adaptez le port si Vite en choisit un autre), ainsi que les deux URL équivalentes en production.

Dans **Authentication > Providers > Email**, activez la confirmation d'adresse e-mail.

Dans **Authentication > Email Templates > Confirm signup**, utilisez le lien `{{ .ConfirmationURL }}` dans le bouton ou le lien de confirmation. L'inscription envoie un lien à l'adresse Gmail; après le clic, la personne revient dans Clinic DC pour renseigner les informations de son établissement, dont son adresse / résidence et, facultativement, son logo. Clinic DC n'enregistre ces informations qu'après la confirmation de l'adresse.

Depuis la connexion, **Mot de passe oublié ?** envoie un lien de réinitialisation par e-mail. Le lien revient sur `/?password-reset=confirmed`, où la personne choisit un nouveau mot de passe d'au moins 8 caractères. Supabase doit autoriser cette URL de redirection dans **Authentication > URL Configuration**.

## 4. Espace médecin, patients, ordonnances et notes médicales

Après connexion, ouvrez **Espace médecin** pour consulter les consultations du jour, retrouver les dossiers patients, les ordonnances récentes et les notes médicales. Une consultation enregistrée comprend son motif, les observations médicales, le praticien et sa date; elle est conservée dans le dossier du patient. Le répertoire permet aussi de rechercher un patient et d'ouvrir sa fiche. La date de naissance sert à calculer automatiquement l'âge et sa catégorie : Enfant (moins de 12 ans), Ado (12 à 17 ans) ou Adulte (18 ans et plus). Depuis la fiche, vous pouvez modifier ses coordonnées, créer une consultation, enregistrer un paiement ou créer une ordonnance avec un ou plusieurs médicaments, leur posologie, fréquence et durée ainsi que des instructions complémentaires.

Le même script crée la table `clinical_notes` et ses politiques RLS. Les tables `patients`, `payments`, `prescriptions` et `clinical_notes` limitent les accès aux données du compte connecté.

Les informations de santé, y compris les notes de consultation, sont sensibles. Configurez soigneusement l'accès aux comptes et ne partagez pas les identifiants. L'accès aux notes et ordonnances est limité au compte de l'établissement par les politiques RLS.

## 5. Paiements et factures

Dans **SQL Editor** de Supabase, exécutez de nouveau le script [`supabase/establishments.sql`](./supabase/establishments.sql) pour créer la table `payments` et ses politiques RLS. L'espace Paiements permet d'enregistrer les règlements liés à un patient, la prestation, le montant encaissé en GNF, l'assurance, le statut payé/partiel ou « Reste à payer par [assurance] », le praticien et la date/heure. Ce dernier statut s'applique lorsque le reste à charge du patient est encaissé, mais que la part de l'assurance reste due. L'historique et le total quotidien sont propres au compte connecté. Les factures/reçus et les ordonnances imprimées affichent le nom, l'adresse et le logo renseignés à l'inscription.

Si Supabase affiche `column patients.birth_date does not exist`, `column payments.total_amount does not exist` ou indique que les tables `prescriptions` / `clinical_notes` sont absentes du cache de schéma, exécutez de nouveau **tout** `supabase/establishments.sql` dans le SQL Editor du bon projet Supabase. Le script ajoute `birth_date` et `total_amount` si nécessaire, crée les deux tables manquantes et recharge le cache PostgREST ; actualisez ensuite l'application. Cette migration ne supprime pas les données existantes. Les noms d'assurance déjà présents sur les fiches patients sont ajoutés à la liste réutilisable. Les paiements conservent le tarif total, la part calculée de l'assurance, le reste à charge du patient et le montant réellement encaissé.

Au paiement, saisissez le tarif total : le montant à encaisser auprès du patient est prérempli avec le reste à charge après couverture d'assurance. Vous pouvez le modifier pour un règlement partiel. Lorsque le reste à charge est encaissé et qu'une part d'assurance reste due, choisissez le statut dynamique « Reste à payer par [nom de l'assurance] ». Le suivi journalier compte les montants réellement reçus du patient, sans inclure la part de l'assurance; un montant nul est autorisé si l'assurance couvre la totalité du tarif.

## 6. Adresse e-mail du projet

L'adresse de contact du projet est `clinicdc224@gmail.com`. Pour l'utiliser comme expéditeur des e-mails de confirmation, configurez un SMTP personnalisé dans les paramètres Auth/SMTP de Supabase et indiquez `Clinic DC` comme nom d'expéditeur et `clinicdc224@gmail.com` comme adresse d'expéditeur.

Si vous utilisez Gmail comme serveur SMTP, configurez-le dans le tableau de bord Supabase (serveur `smtp.gmail.com`) avec un mot de passe d'application Google; ne mettez jamais ce mot de passe dans le code, `.env` ou Git et ne le partagez pas dans la conversation. Le mot de passe d'application nécessite la validation en deux étapes sur le compte Google. Pour des envois transactionnels en production, un fournisseur SMTP dédié offre généralement une meilleure délivrabilité et des limites d'envoi plus adaptées. Tant que le SMTP personnalisé n'est pas configuré, Supabase utilise son service d'e-mail par défaut et l'expéditeur n'est pas cette adresse.

## 7. Démarrer l'application

Dans VS Code, le serveur démarre automatiquement à l'ouverture du dossier et ouvre la démo admin dans le navigateur une fois prêt. Acceptez l'invite de confiance des tâches si VS Code la présente. Le serveur conserve le port `5173`; s'il est déjà utilisé, Vite affiche une erreur explicite au lieu de démarrer sur une autre adresse.

En dehors de VS Code, démarrez-le manuellement :

```sh
npm run dev
```

Pour essayer l'espace administrateur sans créer de compte, cliquez sur **Démo admin** depuis l'accueil ou ouvrez `http://localhost:5173/?preview=dashboard`. Cet aperçu utilise des données fictives en mémoire; ce n'est pas un compte Supabase et les modifications ne sont pas conservées.

Sans variables Supabase, le site reste consultable, mais les opérations d'authentification affichent une erreur de configuration.
