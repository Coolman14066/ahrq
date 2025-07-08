import express from 'express';

export default function createChatRoutes(chatbotService) {
  const router = express.Router();
  
  console.log('[ROUTES] Creating chat routes with chatbotService:', !!chatbotService);

  // POST /api/chat/message
  router.post('/message', async (req, res) => {
    console.log('[ROUTE] POST /api/chat/message called');
    try {
      const { message, context, visualContext, sessionId } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      if (!chatbotService) {
        console.error('[ROUTE ERROR] ChatbotService not initialized');
        return res.status(500).json({ error: 'Chat service not available' });
      }
      
      const response = await chatbotService.processMessage(
        message,
        context || {},
        visualContext,
        sessionId || 'default'
      );
      
      res.json(response);
    } catch (error) {
      console.error('[ROUTE ERROR] Chat message error:', error);
      res.status(500).json({ 
        error: 'Failed to process message',
        details: error.message 
      });
    }
  });

  // POST /api/chat/context
  router.post('/context', async (req, res) => {
    console.log('[ROUTE] POST /api/chat/context called');
    try {
      const { context, sessionId } = req.body;
      
      if (!chatbotService) {
        return res.status(500).json({ error: 'Chat service not available' });
      }
      
      const result = await chatbotService.updateContext(
        sessionId || 'default',
        context
      );
      
      res.json({ success: true, insights: result?.insights });
    } catch (error) {
      console.error('[ROUTE ERROR] Context update error:', error);
      res.status(500).json({ 
        error: 'Failed to update context',
        details: error.message 
      });
    }
  });

  // POST /api/chat/action
  router.post('/action', async (req, res) => {
    console.log('[ROUTE] POST /api/chat/action called');
    try {
      const { action, sessionId } = req.body;
      
      if (!action || !action.type) {
        return res.status(400).json({ error: 'Action type is required' });
      }
      
      if (!chatbotService) {
        return res.status(500).json({ error: 'Chat service not available' });
      }
      
      const result = await chatbotService.executeAction(
        action,
        sessionId || 'default'
      );
      
      res.json(result);
    } catch (error) {
      console.error('[ROUTE ERROR] Action execution error:', error);
      res.status(500).json({ 
        error: 'Failed to execute action',
        details: error.message 
      });
    }
  });

  // GET /api/chat/history/:sessionId
  router.get('/history/:sessionId', async (req, res) => {
    console.log('[ROUTE] GET /api/chat/history called');
    try {
      const { sessionId } = req.params;
      
      if (!chatbotService || !chatbotService.sessions) {
        return res.json({ history: [] });
      }
      
      const session = chatbotService.sessions.get(sessionId);
      
      if (!session) {
        return res.json({ history: [] });
      }
      
      res.json({ 
        history: session.conversationHistory,
        context: session.context 
      });
    } catch (error) {
      console.error('[ROUTE ERROR] History retrieval error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve history',
        details: error.message 
      });
    }
  });

  // DELETE /api/chat/session/:sessionId
  router.delete('/session/:sessionId', async (req, res) => {
    console.log('[ROUTE] DELETE /api/chat/session called');
    try {
      const { sessionId } = req.params;
      
      if (chatbotService) {
        chatbotService.cleanupSession(sessionId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('[ROUTE ERROR] Session cleanup error:', error);
      res.status(500).json({ 
        error: 'Failed to cleanup session',
        details: error.message 
      });
    }
  });

  console.log('[ROUTES] Chat routes created successfully');
  return router;
}