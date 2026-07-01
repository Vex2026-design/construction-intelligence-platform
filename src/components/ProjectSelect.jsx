export default function ProjectSelect({ projects, value, onChange }) {
  return (
    <select value={value || ""} onChange={(event) => onChange(event.target.value)}>
      {projects.map((project) => (
        <option key={project.code} value={project.code}>
          {project.code} · {project.name}
        </option>
      ))}
    </select>
  );
}
