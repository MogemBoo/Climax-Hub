import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='180'><rect width='100%' height='100%' fill='%23222'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23aaa' font-size='16'>No Image</text></svg>";

const PersonDetails = () => {
  const { person_id } = useParams();
  const [person, setPerson] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/person/${person_id}`)
      .then((res) => res.json())
      .then(setPerson)
      .catch(() => setPerson(null));
  }, [person_id]);

  if (!person) return <div className="loader">Loading...</div>;

  return (
    <div className="person-details-page">
      <img
        src={person.profile_img_url || PLACEHOLDER_IMG}
        alt={person.name}
        style={{ width: "180px", height: "270px", objectFit: "cover", borderRadius: "1rem", marginBottom: "1rem", background: "#222" }}
      />
      <h1>{person.name}</h1>
      <p><strong>Birthdate:</strong> {person.birthdate || "Unknown"}</p>
      <p><strong>Bio:</strong> {person.bio || "No bio available."}</p>
    </div>
  );
};

export default PersonDetails;