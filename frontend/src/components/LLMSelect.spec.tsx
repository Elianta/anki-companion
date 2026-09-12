import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { LLMSelectDrawerButton } from '@/components/LLMSelect';
import {
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_PROVIDER,
  useLLMStore,
  type LLMModel,
  type LLMProvider,
} from '@/stores/llm';

const setSelection = (provider: LLMProvider, model: LLMModel) => {
  useLLMStore.setState({ llmProvider: provider, llmModel: model });
};

describe('LLMSelectDrawerButton', () => {
  beforeEach(() => {
    setSelection(DEFAULT_LLM_PROVIDER, DEFAULT_LLM_MODEL);
  });

  it('updates to gpt-5.6-luna from the drawer', async () => {
    const user = userEvent.setup();
    render(<LLMSelectDrawerButton />);

    await user.click(screen.getByLabelText('Select AI model'));
    await user.click(screen.getByTestId('llm-option-openai:gpt-5.6-luna'));

    expect(useLLMStore.getState().llmProvider).toBe('openai');
    expect(useLLMStore.getState().llmModel).toBe('gpt-5.6-luna');
  });

  it('updates to gemini-3.5-flash-lite and gemini-3.7-flash from the drawer', async () => {
    const user = userEvent.setup();
    render(<LLMSelectDrawerButton />);

    await user.click(screen.getByLabelText('Select AI model'));
    await user.click(screen.getByTestId('llm-option-googleai:gemini-3.5-flash-lite'));

    expect(useLLMStore.getState().llmProvider).toBe('googleai');
    expect(useLLMStore.getState().llmModel).toBe('gemini-3.5-flash-lite');

    await user.click(screen.getByLabelText('Select AI model'));
    await user.click(screen.getByTestId('llm-option-googleai:gemini-3.7-flash'));

    expect(useLLMStore.getState().llmProvider).toBe('googleai');
    expect(useLLMStore.getState().llmModel).toBe('gemini-3.7-flash');
  });
});
