# **App Name**: Spendwise

## Core Features:

- Secure User Authentication: Allows users to register and log in via dedicated UI with email/password or Google, and maintains secure user sessions with Firebase Authentication.
- Interactive Dashboard Display: Presents a clean dashboard with dynamically calculated total balance, total income, total expense, and a list of recent transactions, reflecting real-time data from Firestore.
- Comprehensive Transaction Management: Enables users to add, edit, and delete transactions with real-time updates to balances and analytics, leveraging Firestore listeners.
- Detailed Transaction Entry: A dedicated screen with intuitive input fields for amount, category selection (chips or dropdown), transaction type (income/expense toggle), date picker, and an optional note to capture all transaction details.
- Financial Overview Analytics: Displays a basic monthly summary and a category breakdown using a pie chart to visualize spending patterns based on user transactions.
- Real-time Data Synchronization: Utilizes Firestore listeners to ensure all transaction data, balances, and analytics are updated in real time across devices for a consistent user experience.

## Style Guidelines:

- Primary brand color: A deep, sophisticated Indigo-Purple (#523399) derived from a professional and calming aesthetic, offering strong contrast against light elements.
- Background color: A subtle, desaturated lavender-grey (#F6F4FA) for a clean and minimal overall appearance, enhancing readability and content focus.
- Accent color: A vibrant, clear blue (#69A9ED) to highlight interactive elements, calls-to-action, and key information, providing visual emphasis and guiding user attention.
- Semantic colors: A clean green (#43A047) for income indicators and a bold red (#E53935) for expense indicators, for clear financial distinction.
- Headlines and body text: 'Inter' (sans-serif) for its modern, clean, and highly readable characteristics, suitable for all textual content. Note: currently only Google Fonts are supported.
- Utilize modern, outline-style icons for categories and actions, maintaining visual simplicity and immediate recognition.
- Card-based design with rounded corners (16px radius or more) and soft shadows, ensuring clean spacing for a contemporary and organized feel. The layout will be fully responsive and mobile-first.
- Subtle and functional animations for transitions, loading states, and form feedback, providing a polished user experience without distractions.