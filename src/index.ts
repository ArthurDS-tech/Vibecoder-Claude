// import { VibeCodeController } from './core/VibeCodeController';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// export { VibeCodeController };
export { AIEngine, AIConfig } from './ai/engine/AIEngine';
export { Planner, Plan } from './ai/agents/Planner';
// export { Coder, CodeChange, CodeGenerationResult, FileContext } from './ai/agents/Coder';
export { Reviewer, ReviewResult } from './ai/agents/Reviewer';
export { ProjectMemory } from './ai/memory/ProjectMemory';

// Example usage
// async function example() {
//   const controller = new VibeCodeController({
//     ai: {
//       provider: 'openai',
//       model: 'gpt-4',
//       apiKey: process.env.OPENAI_API_KEY || '',
//     },
//     projectRoot: process.cwd(),
//   });

//   // Set project context
//   const memory = controller.getMemory();
//   memory.setStack(['TypeScript', 'Node.js', 'React']);
//   memory.setArchitecture('Modular monolith with clean architecture');

//   // Process an intent
//   const result = await controller.processIntent(
//     'Criar um componente Button reutilizável com variantes primary e secondary'
//   );

//   console.log('\n📊 Resultado:');
//   console.log('Plan:', result.plan);
//   console.log('Result:', result.result);
//   console.log('Review:', result.review);
// }

// // Run example if executed directly
// if (require.main === module) {
//   example().catch(console.error);
// }
