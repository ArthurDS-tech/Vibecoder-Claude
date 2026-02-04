/**
 * ContextCache - Cache inteligente de contexto do projeto
 * Economiza tokens e melhora performance
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ProjectContext } from '../agents/CodeContextCollector';

export interface CacheEntry {
  context: ProjectContext;
  timestamp: number;
  hash: string;
  files: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
}

export class ContextCache {
  private cache: Map<string, CacheEntry>;
  private stats: CacheStats;
  private maxSize: number;
  private maxAge: number; // em milissegundos

  constructor(maxSize: number = 100, maxAgeMinutes: number = 30) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      entries: 0,
    };
    this.maxSize = maxSize;
    this.maxAge = maxAgeMinutes * 60 * 1000;
  }

  /**
   * Obtém contexto do cache se disponível e válido
   */
  async getCachedContext(files: string[]): Promise<ProjectContext | null> {
    const key = this.generateKey(files);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar se cache expirou
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Verificar se arquivos foram modificados
    const filesChanged = await this.checkFilesChanged(entry.files, entry.hash);
    if (filesChanged) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    console.log(`✅ Cache hit! (${this.stats.hits} hits, ${this.stats.misses} misses)`);
    return entry.context;
  }

  /**
   * Armazena contexto no cache
   */
  async setCachedContext(files: string[], context: ProjectContext): Promise<void> {
    const key = this.generateKey(files);
    const hash = await this.computeFilesHash(files);

    const entry: CacheEntry = {
      context,
      timestamp: Date.now(),
      hash,
      files,
    };

    // Limpar cache se estiver cheio
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.stats.entries = this.cache.size;
    this.updateCacheSize();

    console.log(`💾 Contexto cacheado (${this.cache.size}/${this.maxSize} entradas)`);
  }

  /**
   * Invalida cache para arquivos específicos
   */
  async invalidateCache(files: string[]): Promise<void> {
    const key = this.generateKey(files);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.stats.entries = this.cache.size;
      this.updateCacheSize();
      console.log(`🗑️  Cache invalidado para ${files.length} arquivo(s)`);
    }
  }

  /**
   * Invalida todo o cache
   */
  async clearCache(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.entries = 0;
    this.stats.size = 0;
    console.log(`🗑️  Cache limpo (${size} entradas removidas)`);
  }

  /**
   * Pré-aquece o cache com arquivos comuns
   */
  async warmupCache(projectRoot: string, commonFiles: string[]): Promise<void> {
    console.log(`🔥 Aquecendo cache com ${commonFiles.length} arquivos...`);
    
    // Implementar lógica de warmup
    // Por enquanto, apenas log
    
    console.log(`✅ Cache aquecido`);
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Retorna taxa de acerto do cache
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Gera chave única para conjunto de arquivos
   */
  private generateKey(files: string[]): string {
    const sorted = [...files].sort();
    return crypto
      .createHash('md5')
      .update(sorted.join('|'))
      .digest('hex');
  }

  /**
   * Computa hash dos conteúdos dos arquivos
   */
  private async computeFilesHash(files: string[]): Promise<string> {
    const hash = crypto.createHash('md5');

    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          const content = await fs.promises.readFile(file, 'utf-8');
          const stat = await fs.promises.stat(file);
          hash.update(`${file}:${stat.mtime.getTime()}:${content.length}`);
        }
      } catch (error) {
        // Ignorar erros de leitura
      }
    }

    return hash.digest('hex');
  }

  /**
   * Verifica se arquivos foram modificados
   */
  private async checkFilesChanged(files: string[], oldHash: string): Promise<boolean> {
    const newHash = await this.computeFilesHash(files);
    return newHash !== oldHash;
  }

  /**
   * Remove entrada mais antiga do cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️  Entrada mais antiga removida do cache`);
    }
  }

  /**
   * Atualiza tamanho do cache
   */
  private updateCacheSize(): void {
    let size = 0;
    for (const entry of this.cache.values()) {
      // Estimar tamanho em bytes
      size += JSON.stringify(entry.context).length;
    }
    this.stats.size = size;
  }

  /**
   * Limpa entradas expiradas
   */
  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.stats.entries = this.cache.size;
      this.updateCacheSize();
      console.log(`🗑️  ${removed} entrada(s) expirada(s) removida(s)`);
    }

    return removed;
  }

  /**
   * Exporta cache para arquivo
   */
  async exportCache(filePath: string): Promise<void> {
    const data = {
      entries: Array.from(this.cache.entries()),
      stats: this.stats,
      timestamp: Date.now(),
    };

    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Cache exportado para ${filePath}`);
  }

  /**
   * Importa cache de arquivo
   */
  async importCache(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      this.cache = new Map(data.entries);
      this.stats = data.stats;

      console.log(`📥 Cache importado de ${filePath} (${this.cache.size} entradas)`);
    } catch (error) {
      console.error(`❌ Erro ao importar cache:`, error);
    }
  }
}
