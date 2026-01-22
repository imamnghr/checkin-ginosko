/* eslint-disable no-unused-vars */

import { motion } from "framer-motion";

export default function LoadingOverlay({ show }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, -12, 0] }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex flex-col items-center"
      >
        {/* Ganti src dengan logo kamu */}
        <img
          src="/logo-g.png"
          alt="Loading"
          priority
          className="bg-white rounded-full w-10 h-10 p-2"
        />

        <p className="mt-4 text-sm text-white/80 tracking-wide">Please Wait</p>
      </motion.div>
    </div>
  );
}
