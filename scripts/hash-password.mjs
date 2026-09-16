import bcrypt from 'bcryptjs'
import { createInterface } from 'readline'

const rl = createInterface({ input: process.stdin, output: process.stderr })
rl.question('Password: ', async (password) => {
  rl.close()
  const hash = await bcrypt.hash(password, 12)
  process.stdout.write(hash + '\n')
})
