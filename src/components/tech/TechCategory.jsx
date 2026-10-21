import IconMask from "../IconMask.jsx";
import placeholderIcon from "../../assets/tech/placeholder.svg";

// One tech stack category column (spec 006 FR-20, AC-20). Stateless and
// non-interactive: tiles have no links and no tab stops.
export default function TechCategory({ category }) {
  return (
    <div>
      <h3 className="font-display text-lg leading-7 text-text mb-2">{category.title}</h3>
      <ul>
        {category.tools.map((tool) => (
          <li key={tool.id} className="flex items-start gap-3 border-b border-line py-1.5">
            <span className="size-10 shrink-0">
              {tool.icon && !tool.tint ? (
                <img src={tool.icon} alt="" loading="lazy" className="size-full object-contain" />
              ) : tool.icon ? (
                <IconMask src={tool.icon} className="size-full text-text" />
              ) : (
                <IconMask src={placeholderIcon} className="size-full text-muted" />
              )}
            </span>
            <span>
              <span className="block text-base leading-6 text-text wrap-break-word">
                {tool.name}
              </span>
              {tool.use ? (
                <span className="block text-base leading-6 text-muted snap:text-sm snap:leading-5">
                  {tool.use}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
