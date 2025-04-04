import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [storySegments, setStorySegments] = useState([]);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  // Initialize story when API key is available
  useEffect(() => {
    if (apiKey && !initialized && storySegments.length === 0) {
      startNewStory();
    }
  }, [apiKey, initialized, storySegments.length]);

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    if (storySegments.length === 0) {
      startNewStory();
    }
  };

  const startNewStory = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetchFromOpenAI(
        "You are creating a choose-your-own-adventure story. Start a new adventure story with a compelling first paragraph. " +
        "Include a simple ASCII art scene (around 10-15 lines) that represents the setting. " +
        "End with exactly two distinct choices for how the player might proceed. " +
        "Format your response as JSON with the following structure: " +
        "{\"text\": \"story paragraph\", \"art\": \"ASCII art\", \"choices\": [\"choice 1\", \"choice 2\"]}"
      );
      
      const data = JSON.parse(response);
      setStorySegments([{ text: data.text, art: data.art }]);
      setChoices(data.choices);
      setInitialized(true);
    } catch (err) {
      setError('Failed to start story: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choiceIndex) => {
    const selectedChoice = choices[choiceIndex];
    setLoading(true);
    setError('');
    
    try {
      const previousStory = storySegments.map(segment => segment.text).join("\n\n");
      
      const response = await fetchFromOpenAI(
        "Continue the choose-your-own-adventure story. " +
        "Here's the story so far:\n\n" + previousStory + "\n\n" +
        "The player chose: \"" + selectedChoice + "\"\n\n" +
        "Continue the story with a new paragraph based on this choice. " +
        "Include a simple ASCII art scene (around 10-15 lines) that represents the new situation. " +
        "End with exactly two distinct new choices for how the player might proceed. " +
        "Format your response as JSON with the following structure: " +
        "{\"text\": \"story paragraph\", \"art\": \"ASCII art\", \"choices\": [\"choice 1\", \"choice 2\"]}"
      );
      
      const data = JSON.parse(response);
      setStorySegments([...storySegments, { text: data.text, art: data.art }]);
      setChoices(data.choices);
    } catch (err) {
      setError('Failed to continue story: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFromOpenAI = async (prompt) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Unknown API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  return (
    <div className="container">
      <h1 className="title">Choose Your Own Adventure</h1>
      
      {!apiKey ? (
        <div className="api-form">
          <h2 className="title">Enter OpenAI API Key</h2>
          <p>Your API key is stored only in your browser's local storage and is never sent to any server except OpenAI.</p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="input-field"
          />
          <button
            onClick={saveApiKey}
            className="button"
          >
            Save API Key & Start Adventure
          </button>
        </div>
      ) : (
        <>
          {storySegments.length > 0 && (
            <div>
              {storySegments.map((segment, index) => (
                <div key={index} className="story-segment">
                  <div className="ascii-art">
                    <pre>
                      {segment.art}
                    </pre>
                  </div>
                  <p className="story-text">{segment.text}</p>
                </div>
              ))}
            </div>
          )}
          
          {loading ? (
            <div>
              <p>Loading next part of your adventure...</p>
              <div className="loader"></div>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button 
                onClick={() => handleChoice(0)} 
                className="button"
              >
                Try Again
              </button>
            </div>
          ) : (
            choices.length > 0 && (
              <div className="choices-container">
                <h2 className="title">What will you do?</h2>
                <div>
                  {choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => handleChoice(index)}
                      className="choice-button"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                <button
                  onClick={startNewStory}
                  className="button"
                >
                  Start New Adventure
                </button>
              </div>
            )
          )}
          
          <div className="small-text">
            <p>API Key stored locally. <button 
              onClick={() => {
                localStorage.removeItem('openai_api_key');
                setApiKey('');
                setStorySegments([]);
                setChoices([]);
                setInitialized(false);
              }}
              className="link"
            >
              Remove API Key
            </button></p>
          </div>
        </>
      )}
    </div>
  );
}

export default App;