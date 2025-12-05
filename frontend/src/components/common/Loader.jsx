import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => {
    const containerVariants = {
        animate: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const dotVariants = {
        initial: {
            y: "0%",
        },
        animate: {
            y: "100%",
            transition: {
                yoyo: Infinity,
                duration: 0.5,
                ease: "easeInOut",
            },
        },
    };

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <motion.div
                className="flex space-x-2"
                variants={containerVariants}
                initial="initial"
                animate="animate"
            >
                <motion.div className="w-4 h-4 rounded-full bg-neon-red" variants={dotVariants} />
                <motion.div className="w-4 h-4 rounded-full bg-neon-cyan" variants={dotVariants} />
                <motion.div className="w-4 h-4 rounded-full bg-neon-red" variants={dotVariants} />
            </motion.div>
            <p className="mt-4 text-xs font-mono text-gray-400">Morphin Grid initializing...</p>
        </div>
    );
};

export default Loader;