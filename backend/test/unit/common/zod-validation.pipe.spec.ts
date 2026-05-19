import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../src/common/zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().nonnegative(),
  });
  const pipe = new ZodValidationPipe(schema);

  it('returns parsed value on valid input', () => {
    const result = pipe.transform({ name: 'Aylin', age: 30 });
    expect(result).toEqual({ name: 'Aylin', age: 30 });
  });

  it('strips through Zod transforms', () => {
    const trimSchema = z.object({ name: z.string().trim() });
    const trimPipe = new ZodValidationPipe(trimSchema);
    expect(trimPipe.transform({ name: '  hi  ' })).toEqual({ name: 'hi' });
  });

  it('throws BadRequestException on invalid input', () => {
    expect(() => pipe.transform({ name: '', age: -1 })).toThrow(BadRequestException);
  });

  it('includes structured issues in the exception body', () => {
    try {
      pipe.transform({ name: '', age: -1 });
      fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      const body = (e as BadRequestException).getResponse() as {
        message: string;
        errors: Array<{ path: (string | number)[]; message: string }>;
      };
      expect(body.message).toBe('Validation failed');
      expect(body.errors.length).toBeGreaterThanOrEqual(2);
      expect(body.errors.some((er) => er.path.includes('name'))).toBe(true);
      expect(body.errors.some((er) => er.path.includes('age'))).toBe(true);
    }
  });

  it('rejects non-object input for object schemas', () => {
    expect(() => pipe.transform('not an object')).toThrow(BadRequestException);
  });
});
