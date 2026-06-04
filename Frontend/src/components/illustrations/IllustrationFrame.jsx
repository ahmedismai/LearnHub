const IllustrationFrame = ({ children, className = "" }) => {
  return (
    <div
      className={`hidden md:block rounded-2xl border border-white/60 bg-white/65 p-8 shadow-md backdrop-blur-[10px] ${className}`}
    >
      {children}
    </div>
  );
};

export default IllustrationFrame;
