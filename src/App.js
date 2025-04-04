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
    <div className="App">
      <div className="flex flex-col items-center p-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Choose Your Own Adventure</h1>
        
        {!apiKey ? (
          <div className="w-full max-w-md p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Enter OpenAI API Key</h2>
            <p className="mb-4 text-sm">Your API key is stored only in your browser's local storage and is never sent to any server except OpenAI.</p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full p-2 border rounded mb-4"
            />
            <button
              onClick={saveApiKey}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save API Key & Start Adventure
            </button>
          </div>
        ) : (
          <>
            {storySegments.length > 0 && (
              <div className="w-full space-y-8">
                {storySegments.map((segment, index) => (
                  <div key={index} className="mb-8">
                    <div className="bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto">
                      <pre className="text-green-400 font-mono text-sm whitespace-pre">
                        {segment.art}
                      </pre>
                    </div>
                    <p className="text-lg">{segment.text}</p>
                  </div>
                ))}
              </div>
            )}
            
            {loading ? (
              <div className="w-full text-center p-4">
                <p className="text-lg">Loading next part of your adventure...</p>
                <div className="loader mt-4 mx-auto w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="w-full p-4 bg-red-100 text-red-700 rounded-lg">
                <p>{error}</p>
                <button 
                  onClick={() => handleChoice(0)} 
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : (
              choices.length > 0 && (
                <div className="w-full mt-6">
                  <h2 className="text-xl font-semibold mb-4">What will you do?</h2>
                  <div className="space-y-2">
                    {choices.map((choice, index) => (
                      <button
                        key={index}
                        onClick={() => handleChoice(index)}
                        className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-left"
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={startNewStory}
                    className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Start New Adventure
                  </button>
                </div>
              )
            )}
            
            <div className="mt-8 text-sm text-gray-500">
              <p>API Key stored locally. <button 
                onClick={() => {
                  localStorage.removeItem('openai_api_key');
                  setApiKey('');
                  setStorySegments([]);
                  setChoices([]);
                  setInitialized(false);
                }}
                className="text-blue-500 underline"
              >
                Remove API Key
              </button></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;