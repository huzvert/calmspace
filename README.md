# CalmSpace - Mood Tracking App

A full-stack mood tracking application built with React frontend and Azure Functions backend.

## 🌟 Features

- **Log Daily Moods**: Track your emotional state with intuitive mood selection
- **Visual Statistics**: View your mood journey with real-time stats
- **Multi-day Tracking**: Monitor mood patterns across multiple days
- **Responsive Design**: Beautiful UI that works on all devices

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- Modern CSS with gradients and animations

**Backend:**
- Azure Functions (Node.js)
- Azure Cosmos DB
- RESTful API with CORS support

## 📊 Statistics Tracked

- **Days Tracked**: Number of unique days with mood entries
- **Most Common Mood**: Your predominant emotional state
- **Positive Days %**: Percentage of days with positive moods (happy/calm)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Azure Functions Core Tools
- Azure Cosmos DB account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/calmspace.git
   cd calmspace
   ```

2. **Setup Backend (Azure Functions):**
   ```bash
   cd api
   npm install
   # Create local.settings.json with your Cosmos DB credentials
   func start
   ```

3. **Setup Frontend (React):**
   ```bash
   cd web
   npm install
   npm run dev
   ```

### Environment Variables

Create `api/local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_URI": "your-cosmos-db-endpoint",
    "COSMOS_DB_KEY": "your-cosmos-db-key"
  }
}
```

## 🌐 API Endpoints

- `POST /api/CreateMoodEntry` - Log a new mood entry
- `GET /api/GetMoodStats?userId={id}` - Retrieve mood statistics

## 💝 Mood Options

- 😊 Happy
- 😌 Calm  
- 😢 Sad
- 😰 Anxious
- 😴 Tired

## 🎨 Screenshots

[Add screenshots of your app here]

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for mental health awareness
- Inspired by the need for simple mood tracking tools
