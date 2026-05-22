const router = require('express').Router();
const { Note } = require("./../../models/Note.js");
const { authMiddleware } = require('../../utils/auth');

// Apply authMiddleware to all routes in this file
router.use(authMiddleware);

// GET /api/notes - Get all notes for the logged-in user
// THIS IS THE ROUTE THAT CURRENTLY HAS THE FLAW
router.get('/', async (req, res) => {
    // This currently finds all notes in the database.
    // It should only find notes owned by the logged in user.
    try {
        const notes = await Note.find({ user: req.user._id });
        res.json(notes);
    } catch (err) {
        res.status(500).json(err);
    }
});

// POST /api/notes - Create a new note
router.post('/', async (req, res) => {
    try {
        const note = await Note.create({
            ...req.body,
            // The user ID needs to be added here
            user: req.user._id
        });
        res.status(201).json(note);
    } catch (err) {
        res.status(400).json(err);
    }
});

// PUT /api/notes/:id - Update a note
router.put('/:id', async (req, res) => {
    try {
        // Find the note by its ID
        const note = await Note.findById(req.params.id);

        // Check if the note exists
        if (!note) {
            return res.status(404).json({ message: 'No note found with this id!' });
        }

        // Check if the user field on that note matches the authenticated user’s _id
        if (note.user.toString() !== req.user._id.toString()) {
            // They do not match, return a 403 Forbidden status
            return res.status(403).json({
                error: "User is not authorized to update this note."
            });
        }

        // If they match, now proceed with the update
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedNote);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', async (req, res) => {
    try {
        // Find the note by its ID
        const note = await Note.findById(req.params.id);

        // Check first if note exists
        if (!note) {
            return res.status(404).json({ message: 'No note found with this id!' });
        }

        // Check if the current user is the owner 
        if (note.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this note' });
        }

        // Delete the note
        await Note.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Note deleted' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;