export default function DividerBlock({ block, onDelete }) {
  return (
    <div className="block divider-block">
      <hr className="divider-line" />
      <button className="divider-delete btn delete-btn" onClick={() => onDelete(block.id)}>
        Delete
      </button>
    </div>
  );
}
