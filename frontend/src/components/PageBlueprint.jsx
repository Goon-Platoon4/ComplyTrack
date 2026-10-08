import {
  Lightbulb,
  Database,
  Server,
  MousePointerClick,
  ShieldCheck,
  TestTube2,
  AlertCircle,
} from "lucide-react";

export default function PageBlueprint({
  title,
  purpose,
  sections = [],
  data = [],
  actions = [],
  api = [],
  rules = [],
  testing = [],
}) {
  return (
    <div className="page-blueprint">
      <div className="blueprint-header">
        <div className="blueprint-icon">
          <Lightbulb size={20} />
        </div>

        <div>
          <span className="blueprint-kicker">
            DEVELOPMENT BLUEPRINT
          </span>

          <h2>{title}</h2>

          <p>{purpose}</p>
        </div>
      </div>

      <div className="blueprint-grid">

        {/* PAGE SECTIONS */}
        <div className="blueprint-card">
          <div className="blueprint-card-header">
            <Lightbulb size={17} />
            <h3>Page sections</h3>
          </div>

          <ul>
            {sections.map((item, index) => (
              <li key={index}>
                <span className="blueprint-number">
                  {index + 1}
                </span>

                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* DATA */}
        <div className="blueprint-card">
          <div className="blueprint-card-header">
            <Database size={17} />
            <h3>Data required</h3>
          </div>

          <ul>
            {data.map((item, index) => (
              <li key={index}>
                <span className="blueprint-dot" />

                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ACTIONS */}
        <div className="blueprint-card">
          <div className="blueprint-card-header">
            <MousePointerClick size={17} />
            <h3>User actions</h3>
          </div>

          <ul>
            {actions.map((item, index) => (
              <li key={index}>
                <span className="blueprint-dot" />

                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* API */}
        <div className="blueprint-card">
          <div className="blueprint-card-header">
            <Server size={17} />
            <h3>Backend / API</h3>
          </div>

          <ul>
            {api.map((item, index) => (
              <li key={index}>
                <code>{item.method}</code>

                <div>
                  <strong>{item.endpoint}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* BUSINESS RULES */}
        <div className="blueprint-card">
          <div className="blueprint-card-header">
            <ShieldCheck size={17} />
            <h3>Business rules</h3>
          </div>

          <ul>
            {rules.map((item, index) => (
              <li key={index}>
                <span className="blueprint-check">✓</span>

                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* TESTING */}
        <div className="blueprint-card">
          <div className="blueprint-card-header">
            <TestTube2 size={17} />
            <h3>Testing checklist</h3>
          </div>

          <ul>
            {testing.map((item, index) => (
              <li key={index}>
                <span className="blueprint-check">✓</span>

                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div className="blueprint-warning">
        <AlertCircle size={18} />

        <div>
          <strong>This is a development blueprint</strong>

          <p>
            Use this section as the implementation checklist for this
            page. The existing UI below is the visual foundation.
            Do not remove the existing UI unless the team agrees to
            change the design.
          </p>
        </div>
      </div>
    </div>
  );
}