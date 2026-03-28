# 💸 Expense Tracker App

A modern, responsive expense tracker web application built with React and Firebase, designed to help users manage income and expenses with real-time updates and a clean user experience.

---

## 🚀 Features

* 🔐 User Authentication (Login / Register)
* ➕ Add, Edit, Delete Transactions
* 📊 Real-time Expense Tracking
* 💰 Automatic Balance Calculation
* 📂 Category-based organization
* ⚡ Fast and responsive UI
* 🔄 Live sync using Cloud Firestore

---

## 🛠️ Tech Stack

* **Frontend:** React
* **Backend:** Firebase
* **Database:** Cloud Firestore
* **Authentication:** Firebase Authentication
* **Styling:** Tailwind CSS

---

## 📂 Project Structure

```bash
src/
├── components/
│   ├── BalanceCard.jsx
│   ├── ExpenseList.jsx
│   ├── AddExpense.jsx
│
├── pages/
│   ├── Dashboard.jsx
│
├── firebase.js
├── App.js
```

---

## 🔧 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Setup Firebase

1. Go to Firebase Console
2. Create a new project
3. Enable:

   * Authentication (Email/Password)
   * Cloud Firestore
4. Copy your Firebase config

---

### 4. Configure Environment

Create a `.env` file in the root:

```env
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_auth_domain
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_storage_bucket
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id
```

---

### 5. Run the App

```bash
npm run dev
```

---

## 🧱 Firestore Database Structure

```bash
users/
  └── userId/
        ├── name
        ├── email
        └── transactions/
              └── transactionId/
                    ├── type
                    ├── amount
                    ├── category
                    ├── note
                    ├── date
                    ├── createdAt
```

---

## 🔐 Security Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;

      match /transactions/{transactionId} {
        allow read, write: if request.auth != null 
                           && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 📸 Screenshots

> Add your app screenshots here (Dashboard, Add Expense, Analytics)

---

## 🌟 Future Improvements

* 📊 Advanced analytics & charts
* 🌙 Dark mode
* 🔔 Notifications
* 📎 Receipt upload
* 💡 Budget tracking

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork this repo and submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Your Name

* GitHub:(https://github.com/Kishor055/Spendwise-)
