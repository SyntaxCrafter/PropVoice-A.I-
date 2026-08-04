import projectData from "../data/projectData";

function ProjectInfo() {
  return (
    <section className="project-card">

      <div className="card-title">
        <span>PROPERTY KNOWLEDGE</span>
        <span>AI READY</span>
      </div>

      <div className="project-header">

        <div>
          <h2>{projectData.projectName}</h2>

          <p>
            📍 {projectData.location}
          </p>
        </div>

      </div>


      <div className="project-details">

        <div className="project-detail">
          <span>PROPERTY TYPE</span>
          <strong>{projectData.propertyType}</strong>
        </div>

        <div className="project-detail">
          <span>POSSESSION</span>
          <strong>{projectData.possession}</strong>
        </div>

      </div>


      <h3>Available Configurations</h3>

      <div className="configuration-list">

        {projectData.configurations.map((property) => (

          <div
            className="configuration"
            key={property.type}
          >

            <div>
              <strong>{property.type}</strong>

              <span>
                {property.size}
              </span>
            </div>

            <strong>
              {property.price}
            </strong>

          </div>

        ))}

      </div>


      <h3>Amenities</h3>

      <div className="amenities">

        {projectData.amenities.map((amenity) => (

          <span
            className="amenity"
            key={amenity}
          >
            {amenity}
          </span>

        ))}

      </div>

    </section>
  );
}

export default ProjectInfo;