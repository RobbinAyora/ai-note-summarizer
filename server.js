const express = require('express');
const path = require('path');
const cors = require('cors');
const genAI = require('./gemini'); // ✅ Gemini setup
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Define schema and model
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },

}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);

// ✅ Create a new note
app.post('/api/notes', async (req, res) => {
  console.log('🧪 Received body:', req.body);
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const newNote = new Note({ title, content  });
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    console.error('❌ Error saving note:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find({});
    res.json(notes);
  } catch (err) {
    console.error('❌ Error fetching notes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Summarize notes using Gemini
app.post('/api/summarize-notes', async (req, res) => {
  try {
    const notes = await Note.find({}).sort({ createdAt: -1 }).limit(10);

    const fullText = notes.map(note => `Title: ${note.title}\nContent: ${note.content}`).join('\n\n');

    const model = genAI.getGenerativeModel({model: 'gemini-1.5-flash', temperature: 0.2, maxOutputTokens: 500});


    const prompt = `Here are some notes:\n\n${fullText}\n\nSummarize them into bullet points and keep it less than 40 characters:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    const savedSummary = await Summary.create({ Summary: summary});

    console.log('📄 Summary:\n', summary);

    res.json({ summary });
  } catch (err) {
    console.error('❌ Error summarizing notes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const summarySchema = new mongoose.Schema({
  Summary: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now }
})

const Summary = new mongoose.model( 'Summary', summarySchema);

app.get('/api/summaries', async (req, res) => {
  try{
  const Summaries = await Summary.find({}).sort({generatedAt: -1});
  res.json(Summaries);

  }catch(err){
    console.error('Error fetching summaries:', err);
    res.status(500).json({ error: 'Internal server error'});
  }
})

// ✅ Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

