import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const EpisodeDetails = () => {
  const { id } = useParams();
  const [episode, setEpisode] = useState(null);

  useEffect(() => {
    const fetchEpisode = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/episodes/${id}`);
        const data = await res.json();
        setEpisode(data);
      } catch (err) {
        console.error("Failed to fetch episode details");
      }
    };
    fetchEpisode();
  }, [id]);

  if (!episode) return <div style={{ color: 'white', padding: '2rem' }}>Loading episode details...</div>;

  return (
    <div style={{ color: 'white', padding: '2rem' }}>
      <h1>{episode.title}</h1>
      <p><strong>Episode {episode.episode_number}</strong> • {episode.duration} min</p>
      <p>{episode.description}</p>
      {episode.video_url && (
        <div style={{ marginTop: '1rem' }}>
          <iframe
            src={episode.video_url.replace("watch?v=", "embed/")}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Episode Video"
            style={{ width: '100%', height: '400px', borderRadius: '0.5rem' }}
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default EpisodeDetails;
